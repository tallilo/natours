import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe(
  'pk_test_51NiWnoCOTIYb9gYYao9nxm1Y2a6FN4UfMeuVp2TXHtHOodP7hJ74BqmG6ce1zAUQbIkUqr5BwV9Ivr47md9ad1vO00oPWsYmdz',
);

export const bookTour = async (tourId) => {
  try {
    //1) Get checkout session fron API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    //2) Create checkout form +charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
