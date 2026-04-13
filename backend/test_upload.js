const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    const response = JSON.parse(data);
    console.log('Login Response:', response.user.role);
    
    // Test upload
    const boundary = 'MyAppBoundary';
    const postData = '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="file"; filename="test.txt"\r\n' +
      'Content-Type: text/plain\r\n\r\n' +
      'File content\r\n' +
      '--' + boundary + '--\r\n';

    const upOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/files/upload',
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data; boundary=' + boundary,
            'Authorization': 'Bearer ' + response.token
        }
    };
    
    const upReq = http.request(upOptions, upRes => {
        let upData = '';
        upRes.on('data', c => upData += c);
        upRes.on('end', () => {
            console.log('Upload Status:', upRes.statusCode);
            console.log('Upload Result:', upData);
        });
    });
    upReq.write(postData);
    upReq.end();
  });
});

req.write(JSON.stringify({ email: 'user2@cloudnest.com', password: 'password123' }));
req.end();
