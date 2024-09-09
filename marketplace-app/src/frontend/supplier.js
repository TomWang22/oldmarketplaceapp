document.addEventListener("DOMContentLoaded", async () => {
  // Define your variables and DOM elements
  const addSupplyButton = document.getElementById("addSupplyButton");
  const addSupplyByIdButton = document.getElementById("addSupplyByIdButton");
  const sendSuppliesButton = document.getElementById("sendSuppliesButton");
  const notificationsList = document.getElementById("notificationsList");
  const supplyRequestsList = document.getElementById("supplyRequestsList");
  const viewRequestsButton = document.getElementById("viewRequestsButton");
  const chatInput = document.getElementById("chatInput");
  const chatSendButton = document.getElementById("chatSendButton");
  const chatList = document.getElementById("chatList");
  const logoutButton = document.getElementById("logoutButton");
  const accountButton = document.getElementById("accountButton");
  const homeButton = document.getElementById("homeButton");
  const supplierAccountSection = document.getElementById(
    "supplier-account-section"
  );
  const supplierUsername = document.getElementById("supplierUsername");
  const supplierBalance = document.getElementById("supplierBalance");
  const listSuppliesButton = document.getElementById("listSuppliesButton");
  const suppliesList = document.getElementById("suppliesList");

  // Retrieve supplier ID from local storage
  const supplierId = localStorage.getItem("userId");
  if (!supplierId) {
    console.error("Supplier ID is not set in local storage");
    return;
  }

  // Establish a WebSocket connection
  const socket = io("http://localhost:3000", {
    transports: ["websocket"],
    query: { userId: supplierId },
  });

  let requestsVisible = false;

  // Handle previous chat messages
  socket.on("previousChats", (chats) => {
    chatList.innerHTML = "";
    chats.forEach((chat) => {
      const chatItem = document.createElement("li");
      chatItem.textContent = `${chat.username} (${chat.role}, ID: ${chat.user_id}): ${chat.message} (${chat.timestamp})`;
      chatList.appendChild(chatItem);
    });
  });

  // Handle incoming chat messages
  socket.on("receiveMessage", (chat) => {
    const chatItem = document.createElement("li");
    chatItem.textContent = `${chat.username} (${chat.role}, ID: ${chat.user_id}): ${chat.message} (${chat.timestamp})`;
    chatList.appendChild(chatItem);
  });

  // Send a chat message
  chatSendButton.addEventListener("click", () => {
    const message = chatInput.value;
    if (message) {
      socket.emit("sendMessage", {
        message,
        userId: supplierId,
        role: "supplier",
      });
      chatInput.value = "";
    }
  });

  // Display a notification message
  function displayNotification(message) {
    const listItem = document.createElement("li");
    listItem.textContent = message;
    notificationsList.appendChild(listItem);
  }

  // Toggle supply requests visibility
  viewRequestsButton.addEventListener("click", async () => {
    requestsVisible = !requestsVisible;
    if (requestsVisible) {
      await fetchSupplyRequests();
      supplyRequestsList.style.display = "block";
    } else {
      supplyRequestsList.style.display = "none";
    }
  });

  // Fetch supply requests from the server
  async function fetchSupplyRequests() {
    try {
      const response = await fetch("http://localhost:3000/api/supply-requests");
      const data = await response.json();
      supplyRequestsList.innerHTML = "";

      // Log the raw data received
      console.log("Fetched supply requests (raw):", data);

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch supply requests.");
      }

      // Log the requests array
      console.log("Fetched supply requests (requests array):", data.requests);

      const pendingRequests = data.requests.filter(
        (request) => request.status === "pending"
      );

      // Log the filtered requests
      console.log("Pending supply requests:", pendingRequests);

      if (pendingRequests.length === 0) {
        const noRequestsMessage = document.createElement("p");
        noRequestsMessage.textContent = "No pending supply requests.";
        supplyRequestsList.appendChild(noRequestsMessage);
      }

      pendingRequests.forEach((request) => {
        console.log("Processing request:", request); // Log each request
        const listItem = document.createElement("div");
        listItem.className = "request-item";
        listItem.innerHTML = `
            <div>
              <span>Product ID: ${request.product_id} - Quantity: ${request.quantity}</span>
              <button class="fulfillRequestButton" data-merchant-id="${request.merchant_id}" data-product-id="${request.product_id}" data-quantity="${request.quantity}">Fulfill</button>
            </div>
          `;
        supplyRequestsList.appendChild(listItem);
      });

      document.querySelectorAll(".fulfillRequestButton").forEach((button) => {
        button.addEventListener("click", async (event) => {
          const merchantId = button.getAttribute("data-merchant-id");
          const productId = button.getAttribute("data-product-id");
          const quantity = button.getAttribute("data-quantity");
          const listItem = button.parentElement;
          await fulfillSupplyRequest(merchantId, productId, quantity, listItem);
        });
      });
    } catch (error) {
      console.error("Error fetching supply requests:", error);
    }
  }

  // Fulfill a supply request
  async function fulfillSupplyRequest(
    merchantId,
    productId,
    quantity,
    listItem
  ) {
    try {
      const response = await fetch(
        "http://localhost:3000/api/fulfill-supply-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ supplierId, merchantId, productId, quantity }),
        }
      );
      const data = await response.json();
      if (data.success) {
        displayNotification(
          `Sent ${quantity} units of product ID ${productId} to merchant ID ${merchantId}`
        );
        listItem.remove(); // Remove the list item from the UI
      } else {
        displayNotification(`Failed to send supplies: ${data.message}`);
        alert(`Failed to send supplies: ${data.message}`);
      }
    } catch (error) {
      console.error("Error sending supplies:", error);
      displayNotification("An error occurred while sending supplies.");
      alert("An error occurred while sending supplies.");
    }
  }

  // Toggle supply list visibility
  listSuppliesButton.addEventListener("click", async () => {
    if (
      suppliesList.style.display === "none" ||
      suppliesList.innerHTML === ""
    ) {
      await fetchSupplies();
      suppliesList.style.display = "block";
      listSuppliesButton.textContent = "Hide Supplies";
    } else {
      suppliesList.style.display = "none";
      listSuppliesButton.textContent = "List Supplies";
    }
  });

  // Fetch supplies from the server
  async function fetchSupplies() {
    try {
      const response = await fetch("http://localhost:3000/api/supplies");
      const data = await response.json();
      suppliesList.innerHTML = "";
      if (data.success && data.supplies.length > 0) {
        data.supplies.forEach((supply) => {
          const listItem = document.createElement("div");
          listItem.className = "supply-item";
          listItem.innerHTML = `
              <div>
                <img src="${supply.image_url}" alt="${supply.name}" width="50" height="50">
                <span>Product ID: ${supply.id} - Name: ${supply.name} - Description: ${supply.description} - Quantity: ${supply.stock}</span>
              </div>
            `;
          suppliesList.appendChild(listItem);
        });
      } else {
        suppliesList.innerHTML = "<p>No supplies found.</p>";
      }
      suppliesList.style.display = "block";
    } catch (error) {
      console.error("Error fetching supplies:", error);
      suppliesList.innerHTML = "<p>Error fetching supplies.</p>";
      suppliesList.style.display = "block";
    }
  }

  // Add a new supply
  if (addSupplyButton) {
    addSupplyButton.addEventListener("click", () => {
      const name = document.getElementById("supplyName").value;
      const description = document.getElementById("supplyDescription").value;
      const price = parseFloat(document.getElementById("supplyPrice").value);
      const cost = parseFloat(document.getElementById("supplyCost").value);
      const stock = parseInt(document.getElementById("supplyStock").value);
      const image_url = document.getElementById("supplyImageUrl").value;
      addSupply(name, description, price, cost, stock, image_url);
    });
  }

  async function addSupply(name, description, price, cost, stock, image_url) {
    try {
      const response = await fetch("http://localhost:3000/api/supplies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name,
          description,
          price,
          cost,
          stock,
          image_url,
          supplierId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        displayNotification(`Supply "${name}" added successfully.`);
        clearAddSupplyForm();
        alert(`Supply "${name}" added successfully.`);
      } else {
        displayNotification(`Failed to add supply: ${data.message}`);
        alert(`Failed to add supply: ${data.message}`);
      }
    } catch (error) {
      console.error("Error adding supply:", error);
      displayNotification("An error occurred while adding supply.");
      alert("An error occurred while adding supply.");
    }
  }

  // Add supply by ID and quantity
  if (addSupplyByIdButton) {
    addSupplyByIdButton.addEventListener("click", () => {
      const id = document.getElementById("supplyId").value;
      const quantity = parseInt(
        document.getElementById("supplyQuantity").value
      );
      addSupplyById(id, quantity);
    });
  }

  async function addSupplyById(id, quantity) {
    try {
      const response = await fetch(
        "http://localhost:3000/api/add-supply-by-id",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ id, quantity }),
        }
      );
      const data = await response.json();
      if (data.success) {
        displayNotification(`Supply with ID "${id}" added successfully.`);
        clearAddSupplyByIdForm();
        alert(`Supply with ID "${id}" added successfully.`);
      } else {
        displayNotification(`Failed to add supply: ${data.message}`);
        alert(`Failed to add supply: ${data.message}`);
      }
    } catch (error) {
      console.error("Error adding supply by ID:", error);
      displayNotification("An error occurred while adding supply by ID.");
      alert("An error occurred while adding supply by ID.");
    }
  }

  // Clear form inputs for adding a new supply
  function clearAddSupplyForm() {
    document.getElementById("supplyName").value = "";
    document.getElementById("supplyDescription").value = "";
    document.getElementById("supplyPrice").value = "";
    document.getElementById("supplyCost").value = "";
    document.getElementById("supplyStock").value = "";
    document.getElementById("supplyImageUrl").value = "";
  }

  // Clear form inputs for adding supply by ID
  function clearAddSupplyByIdForm() {
    document.getElementById("supplyId").value = "";
    document.getElementById("supplyQuantity").value = "";
  }

  // Logout and clear local storage
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("userId");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "login.html";
    });
  }

  // Navigate to home page
  if (homeButton) {
    homeButton.addEventListener("click", () => {
      window.location.href = "marketplace.html";
    });
  }

  // Display supplier account information
  if (accountButton) {
    accountButton.addEventListener("click", async () => {
      await displaySupplierAccountInfo();
    });
  }

  // Fetch supplier data from the server
  async function fetchSupplierData(supplierId) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/account-info?userId=${supplierId}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      if (data.success) {
        console.log("Fetched supplier data:", data.account); // Log the supplier data
        return data.account;
      } else {
        console.error("Failed to fetch supplier data:", data.message);
        return null;
      }
    } catch (error) {
      console.error("Error fetching supplier data:", error);
      return null;
    }
  }

  // Display supplier account information on the UI
  async function displaySupplierAccountInfo() {
    const supplierData = await fetchSupplierData(supplierId);
    console.log("Supplier data:", supplierData); // Log supplier data
    if (supplierData) {
      supplierUsername.textContent = supplierData.username || "N/A";
      const balance = parseFloat(supplierData.balance);
      supplierBalance.textContent = isNaN(balance)
        ? "0.00"
        : balance.toFixed(2);
      // Add more account details here if needed
    } else {
      supplierUsername.textContent = "N/A";
      supplierBalance.textContent = "0.00";
    }

    // Show account section and hide other sections if necessary
    supplierAccountSection.style.display = "block";
    document.getElementById("send-supplies-section").style.display = "none";
    document.getElementById("add-supplies-section").style.display = "none";
    document.getElementById("view-requests-section").style.display = "none";
    document.getElementById("add-supplies-id-quantity-section").style.display =
      "none";
    document.getElementById("chatContainer").style.display = "none";
  }
});
