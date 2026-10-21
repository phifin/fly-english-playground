// Public Firebase web configuration only. These values are identifiers, not admin
// credentials. Never put a service-account key or private API token in this file.
// Local learning works with this default. See cloud/DEPLOYMENT.md before enabling.
export const cloudConfig = {
  enabled: false,
  firebase: {
    apiKey: '',
    authDomain: '', // YOUR_PROJECT_ID.firebaseapp.com
    projectId: '',
    appId: '',
  },
};
