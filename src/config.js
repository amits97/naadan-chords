export default {
  apiGateway: {
    REGION: "ap-south-1",
    URL: "https://api.naadanchords.com"
  },
  cognito: {
    REGION: "ap-south-1",
    USER_POOL_ID: "ap-south-1_l5klM91tP",
    APP_CLIENT_ID: "senbvolbdevcqlj220thd1dgo",
    IDENTITY_POOL_ID: "ap-south-1:fec564e7-c7fc-4a74-bb42-b67b6c4eacbf"
  },
  storage: {
    BUCKET: 'naadanchords-images',
    REGION: 'ap-south-1'
  },
  oauth: {
    DOMAIN : 'naadan-chords.auth.ap-south-1.amazoncognito.com', 
    REDIRECT_SIGN_IN : 'https://www.naadanchords.com/login',
    REDIRECT_SIGN_OUT : 'https://www.naadanchords.com/login'
  },
  noAds: [
    "innum-konjam-neram-maryan"
  ]
};