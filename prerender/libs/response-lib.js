export function success(body) {
  return buildResponse(200, body);
}

export function failure(body) {
  return buildResponse(400, body);
}

export function redirect(headers) {
  let location = headers.replace("Location: ", "");
  return {
    statusCode: 301,
    headers: {
      "Location": location
    }
  };
}

export function custom(status, body) {
  return buildResponse(status, body);
}

function buildResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "Content-Type": "text/html"
    },
    body: body
  };
}