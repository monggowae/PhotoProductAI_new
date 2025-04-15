export interface Settings {
  token_expiration: { days: number };
  minimum_token_request: { amount: number };
  minimum_balance: { amount: number };
  welcome_token: { amount: number };
  service_fees: {
    photo_product: number;
    fashion_photography: number;
    animal_photography: number;
    photo_modification: number;
    food_photography: number;
  };
}