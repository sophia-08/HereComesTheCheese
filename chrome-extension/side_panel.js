// side_panel.js
document.getElementById('submitButton').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    // Perform actions with the username and password values
    console.log('Username:', username);
    console.log('Password:', password);
 
    
    chrome.runtime.sendMessage({
        type: 'loginCredentials',
        username: username,
        password: password
      });
   
    // You can also send the values to the content script or background script using chrome.runtime.sendMessage
  });
  
  let i= 0;
  document.getElementById('sendNativeMessageButton').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'sendNativeMessage',
      payload: 'hello '+i
    });
    i = i+1
  });