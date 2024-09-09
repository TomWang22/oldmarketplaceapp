document.addEventListener("DOMContentLoaded", () => {
  // Event listener for the login form submission
  document
    .getElementById("loginForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault(); // Prevent the default form submission

      // Get the username and password input values
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      console.log("Submitting login:", { username, password }); // Log the login details

      try {
        // Make a POST request to the login API
        const response = await fetch("http://localhost:3000/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }), // Send the login details in the request body
        });

        console.log("Response status:", response.status); // Log the response status

        const data = await response.json(); // Parse the response JSON
        console.log("Response data:", data); // Log the response data

        // Check if the login was successful
        if (response.ok && data.success) {
          // Store the received token, role, and userId in local storage
          localStorage.setItem("token", data.token);
          localStorage.setItem("role", data.role);
          localStorage.setItem("userId", data.userId);

          alert("Login successful!"); // Notify the user of successful login

          // Redirect the user based on their role
          if (data.role === "merchant") {
            console.log("Redirecting to merchant.html");
            window.location.href = "merchant.html"; // Ensure correct path
          } else if (data.role === "supplier") {
            console.log("Redirecting to supplier.html");
            window.location.href = "supplier.html"; // Ensure correct path
          } else if (data.role === "shopper") {
            console.log("Redirecting to shopper.html");
            window.location.href = "shopper.html"; // Ensure correct path
          } else {
            console.log("Redirecting to dashboard.html");
            window.location.href = "dashboard.html"; // Default redirection
          }
        } else {
          console.error("Login failed:", data.message); // Log the failure message
          alert("Login failed: " + data.message); // Notify the user of the failure
        }
      } catch (error) {
        console.error("Login failed:", error); // Log any errors that occur during the login process
        alert("An error occurred during login."); // Notify the user of the error
      }
    });

  // Event listener for the create account button
  document.getElementById("createAccountBtn").addEventListener("click", () => {
    window.location.href = "createaccount.html"; // Redirect to the create account page
  });
});
