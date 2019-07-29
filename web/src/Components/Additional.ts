export const callApi = async (url: string, method: string, body?: any) => {
    const response = await fetch(url, {
      method: method,
      credentials: "same-origin",

      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },

      //make sure to serialize your JSON body
      body: body
    });
    const respbody = await response.json();

    if (response.status !== 200) throw Error(respbody.message);

    return respbody;
  };