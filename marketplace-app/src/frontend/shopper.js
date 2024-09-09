document.addEventListener("DOMContentLoaded", () => {
  // Define your variables and DOM elements
  const inventoryButton = document.getElementById("inventoryButton");
  const inventoryContainer = document.getElementById("inventoryContainer");
  const inventoryItemsList = document.getElementById("inventoryItemsList");
  const shoppingCartButton = document.getElementById("shoppingCartButton");
  const cartItemsContainer = document.getElementById("cartItemsContainer");
  const cartItemsList = document.getElementById("cartItemsList");
  const addFundsButton = document.getElementById("addFundsButton");
  const fundsAmountInput = document.getElementById("fundsAmount");
  const returnMerchandiseButton = document.getElementById(
    "returnMerchandiseButton"
  );
  const productIdInput = document.getElementById("productId");
  const returnQuantityInput = document.getElementById("returnQuantity");
  const shopButton = document.getElementById("shopButton");
  const cartItemCount = document.getElementById("cartItemCount");
  const totalCostElement = document.getElementById("totalCost");
  const chatContainer = document.getElementById("chatContainer");
  const chatInput = document.getElementById("chatInput");
  const chatSendButton = document.getElementById("chatSendButton");
  const chatList = document.getElementById("chatList");

  // Retrieve the userId from local storage
  const userId = localStorage.getItem("userId");
  const logoutButton = document.getElementById("logoutButton");

  // Logout button event listener
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "login.html";
  });

  // Redirect to login if user is not logged in
  if (!userId) {
    alert("User not logged in!");
    window.location.href = "/login.html";
    return;
  }

  // Initialize WebSocket connection
  const socket = io("http://localhost:3000", {
    transports: ["websocket"],
    query: { userId },
  });

  // Event listener for receiving previous chats
  socket.on("previousChats", (chats) => {
    chatList.innerHTML = "";
    chats.forEach((chat) => {
      const chatItem = document.createElement("li");
      chatItem.textContent = `${chat.username} (${chat.role}, ID: ${chat.user_id}): ${chat.message} (${chat.timestamp})`;
      chatList.appendChild(chatItem);
    });
  });

  // Event listener for receiving new messages
  socket.on("receiveMessage", (chat) => {
    const chatItem = document.createElement("li");
    chatItem.textContent = `${chat.username} (${chat.role}, ID: ${chat.user_id}): ${chat.message} (${chat.timestamp})`;
    chatList.appendChild(chatItem);
  });

  // Event listener for sending a new message
  chatSendButton.addEventListener("click", () => {
    const message = chatInput.value;
    if (message) {
      socket.emit("sendMessage", { message, userId, role: "shopper" });
      chatInput.value = "";
    }
  });

  // Function to fetch cart items from the server
  const fetchCartItems = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/cart?userId=${userId}`
      );
      const data = await response.json();
      return data.items;
    } catch (error) {
      console.error("Error fetching cart items:", error);
      return [];
    }
  };

  // Function to display cart items
  const displayCartItems = async () => {
    const cartItems = await fetchCartItems();

    // Update cart item count
    cartItemCount.textContent = cartItems.length;

    // Clear the current list
    cartItemsList.innerHTML = "";

    let totalCost = 0;

    // Populate the list with cart items
    cartItems.forEach((item) => {
      const listItem = document.createElement("li");

      const itemDetails = document.createElement("div");
      itemDetails.className = "cart-item-details";
      const price = parseFloat(item.price); // Convert price to a number
      itemDetails.innerHTML = `<span>${item.product} - $${price.toFixed(
        2
      )}</span>`;

      const itemQuantity = document.createElement("div");
      itemQuantity.className = "cart-item-quantity";
      itemQuantity.innerHTML = `
                <button class="quantity-decrease">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-increase">+</button>
            `;

      const removeButton = document.createElement("button");
      removeButton.className = "remove-button";
      removeButton.textContent = "Remove";

      listItem.appendChild(itemDetails);
      listItem.appendChild(itemQuantity);
      listItem.appendChild(removeButton);
      cartItemsList.appendChild(listItem);

      totalCost += price * item.quantity;

      // Event listener for quantity decrease
      itemQuantity
        .querySelector(".quantity-decrease")
        .addEventListener("click", async () => {
          if (item.quantity > 1) {
            await updateCartItemQuantity(item.id, item.quantity - 1, userId);
            displayCartItems();
          }
        });

      // Event listener for quantity increase
      itemQuantity
        .querySelector(".quantity-increase")
        .addEventListener("click", async () => {
          await updateCartItemQuantity(item.id, item.quantity + 1, userId);
          displayCartItems();
        });

      // Event listener for remove button
      removeButton.addEventListener("click", async () => {
        await removeCartItem(item.id, userId);
        displayCartItems();
      });
    });

    // Update total cost element
    totalCostElement.textContent = `Total: $${totalCost.toFixed(2)}`;

    // Show the cart items container
    cartItemsContainer.style.display = "block";
  };

  // Function to update item quantity in the cart
  const updateCartItemQuantity = async (itemId, quantity, userId) => {
    try {
      await fetch(`http://localhost:3000/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity, userId }),
      });
    } catch (error) {
      console.error("Error updating item quantity:", error);
    }
  };

  // Function to remove item from the cart
  const removeCartItem = async (itemId, userId) => {
    try {
      await fetch(`http://localhost:3000/api/cart/${itemId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      console.error("Error removing item from cart:", error);
    }
  };

  // Function to add funds to user's account
  const addFunds = async () => {
    const amount = parseFloat(fundsAmountInput.value);

    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/add-funds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, amount }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Funds added successfully. Amount: $${amount.toFixed(2)}`);
        fundsAmountInput.value = ""; // Clear the input field
      } else {
        alert("Failed to add funds: " + data.message);
      }
    } catch (error) {
      console.error("Error adding funds:", error);
      alert("An error occurred while adding funds.");
    }
  };

  // Function to return merchandise
  const returnMerchandise = async () => {
    const productId = parseInt(productIdInput.value);
    const quantity = parseInt(returnQuantityInput.value);

    if (isNaN(productId) || isNaN(quantity) || quantity <= 0) {
      alert("Please enter valid product ID and quantity");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/api/return-merchandise",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, productId, quantity }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Merchandise returned successfully.");
      } else {
        alert("Failed to return merchandise: " + data.message);
      }
    } catch (error) {
      console.error("Error returning merchandise:", error);
      alert("An error occurred while returning merchandise.");
    }
  };

  // Function to fetch inventory items from the server
  const fetchInventoryItems = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/inventory?userId=${userId}`
      );
      const data = await response.json();
      return data.items;
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      return [];
    }
  };

  // Function to display inventory items
  const displayInventoryItems = async () => {
    if (inventoryContainer.style.display === "block") {
      inventoryContainer.style.display = "none";
      return;
    }

    const inventoryItems = await fetchInventoryItems();

    // Clear the current list
    inventoryItemsList.innerHTML = "";

    // Populate the list with inventory items
    inventoryItems.forEach((item) => {
      const listItem = document.createElement("li");
      const price = parseFloat(item.price); // Convert price to a number
      listItem.innerHTML = `<span>${item.product} - $${price.toFixed(
        2
      )} - Quantity: ${item.quantity}</span>`;
      inventoryItemsList.appendChild(listItem);
    });

    // Show the inventory items container
    inventoryContainer.style.display = "block";
  };

  // Event listeners for buttons
  addFundsButton.addEventListener("click", addFunds);
  returnMerchandiseButton.addEventListener("click", returnMerchandise);
  shoppingCartButton.addEventListener("click", () => {
    window.location.href = "shopping-cart.html";
  });
  inventoryButton.addEventListener("click", displayInventoryItems);

  // Event listener for Shop button
  shopButton.addEventListener("click", () => {
    window.location.href = "marketplace.html";
  });

  // Update cart item count on page load
  displayCartItems();
});
