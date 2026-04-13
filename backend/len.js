console.log("Uploader:", Buffer.byteLength(JSON.stringify({success:false,message:"User role 'uploader' is not authorized to access this route"})));
console.log("Viewer:", Buffer.byteLength(JSON.stringify({success:false,message:"User role 'viewer' is not authorized to access this route"})));
