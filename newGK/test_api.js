const { apiFunction } = require('./newGK/src/apis/apiFunction');
// Wait, apiFunction in react-native uses fetch which is available in Node 18+.
// Let's just write a direct node-fetch script

async function testApi() {
  const url = "https://webservice.tecalliance.services/pegasus-3-0/services/TecdocToCatDLB.jsonEndpoint";
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const payload = {
    "getAmBrandAddress": {
      "articleCountry": "ZA",
      "provider": 21857, // just guessing NGK provider id? Or maybe we can omit provider?
      "lang": "en"
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log(JSON.stringify(data).substring(0, 500));
  } catch (err) {
    console.error(err);
  }
}

testApi();
