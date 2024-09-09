document.addEventListener("DOMContentLoaded", () => {
  // Event listener for the account creation form submission
  document
    .getElementById("createAccountForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault(); // Prevent the default form submission

      // Get the username, password, and role input values
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const role = document.getElementById("role").value;

      console.log("Submitting registration:", { username, password, role }); // Log the registration details

      try {
        // Make a POST request to the registration API
        const response = await fetch("http://localhost:3000/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password, role }), // Send the registration details in the request body
        });

        console.log("Response status:", response.status); // Log the response status

        const data = await response.json(); // Parse the response JSON
        console.log("Response data:", data); // Log the response data

        // Check if the registration was successful
        if (response.ok && data.success) {
          alert("Account created successfully!"); // Notify the user of successful account creation
          window.location.href = "login.html"; // Redirect to the login page, ensure the correct path
        } else {
          console.error("Registration failed:", data.message); // Log the failure message
          alert("Registration failed: " + data.message); // Notify the user of the failure
        }
      } catch (error) {
        console.error("Registration failed:", error); // Log any errors that occur during the registration process
        alert("An error occurred during registration."); // Notify the user of the error
      }
    });
});
