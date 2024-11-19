
// Helper Functions for Credential Management
function saveCredentialsNative(username, password) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentUrl = tabs[0].url;
      const domain = extractDomain(currentUrl);
  
      const credentialsObject = {
        type: "saveCredentials",
        username: username,
        password: password,
        domain: domain,
      };
      sendNativeMessage({ payload: credentialsObject });
    });
  }
  
  function retrieveCredentialsNative() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentUrl = tabs[0].url;
      const domain = extractDomain(currentUrl);
  
      const retrieveRequest = {
        type: "retrieveCredentials",
        domain: domain,
      };
      sendNativeMessage({ payload: retrieveRequest });
    });
  }

// Message Handlers
function handleLoginCredentials(message) {
    const { username, password } = message;
    console.log("Received credentials from side panel:");
    console.log("Username:", username);
    console.log("Password:", password);
  
    // Save credentials using the helper function
    saveCredentialsNative(username, password);
  }

  function handleRetrievedCredentials(username, password) {
    // Check if username and password are valid (non-empty strings)
    console.log("handleRetrievedCredentials", username, password);
    if (
      typeof username === "string" &&
      username.trim() !== "" &&
      typeof password === "string" &&
      password.trim() !== ""
    ) {
      // Credentials are valid, proceed with filling the login form
      // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      //   chrome.tabs.sendMessage(tabs[0].id, {
      //     type: "fillLoginForm",
      //     username: username,
      //     password: password
      //   });
      // });
    } else {
      // Log an error if credentials are invalid
      console.error(
        "Retrieved credentials are invalid. Username or password is empty or not a string."
      );
  
      // Optionally, you can send a message to the user interface to inform the user
      // chrome.runtime.sendMessage({
      //   type: "credentialError",
      //   message: "Unable to retrieve valid credentials. Please check your saved information."
      // });
    }
  }
  

function fillAndSubmitForm(formData) {
    console.log("fillAndSubmitForm", formData);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: fillForm,
          args: [formData],
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
          }
          console.log("Form filled and submitted");
        }
      );
    });
  }
  
  function fillForm(formData) {
    // const formData = JSON.parse(formData_str);
    // console.log("formData", formData)
    if (formData.username) {
      const usernameField = document.getElementById(formData.username);
      if (usernameField) {
        usernameField.value = "testsii.woods";
        console.log("Username field filled with 'test'");
      } else {
        console.log("Username field not found");
      }
    }
  
    if (formData.submit) {
      const submitButton = document.getElementById(formData.submit);
      if (submitButton) {
        submitButton.click();
        console.log("Submit button clicked");
      } else {
        console.log("Submit button not found");
      }
    }
  }
  