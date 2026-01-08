import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook token
    const hottok = req.headers.get('x-hotmart-hottok');
    const expectedToken = Deno.env.get('HOTMART_WEBHOOK_TOKEN');
    
    if (!hottok || hottok !== expectedToken) {
      console.error('Invalid Hotmart webhook token');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json();
    console.log('Hotmart webhook received:', JSON.stringify(payload, null, 2));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const event = payload.event;
    const data = payload.data;
    
    // Extract buyer email
    const buyerEmail = data?.buyer?.email;
    if (!buyerEmail) {
      console.error('No buyer email in payload');
      return new Response(JSON.stringify({ error: 'No buyer email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('Error listing users:', userError);
      throw userError;
    }

    const user = userData.users.find(u => u.email === buyerEmail);
    if (!user) {
      console.log(`User not found for email: ${buyerEmail}`);
      return new Response(JSON.stringify({ message: 'User not found, webhook stored for later' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    const transactionId = data?.purchase?.transaction;
    const subscriptionCode = data?.subscription?.subscriber?.code;

    // Handle different Hotmart events
    let updateData: Record<string, unknown> = {};

    switch (event) {
      case 'PURCHASE_APPROVED':
      case 'PURCHASE_COMPLETE':
        console.log(`Processing approved purchase for user: ${userId}`);
        updateData = {
          status: 'active',
          hotmart_transaction_id: transactionId,
          hotmart_subscription_code: subscriptionCode,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
        break;

      case 'SUBSCRIPTION_CANCELLATION':
      case 'PURCHASE_CANCELED':
        console.log(`Processing cancellation for user: ${userId}`);
        updateData = {
          status: 'cancelled',
        };
        break;

      case 'PURCHASE_REFUNDED':
      case 'PURCHASE_CHARGEBACK':
        console.log(`Processing refund/chargeback for user: ${userId}`);
        updateData = {
          status: 'expired',
        };
        break;

      case 'PURCHASE_DELAYED':
      case 'PURCHASE_BILLET_PRINTED':
        console.log(`Payment pending for user: ${userId}`);
        // Keep current status, payment not confirmed yet
        break;

      default:
        console.log(`Unhandled event type: ${event}`);
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        throw updateError;
      }

      console.log(`Subscription updated successfully for user: ${userId}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
