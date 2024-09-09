document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('query').trim().toLowerCase();

    const searchResultsSection = document.getElementById('search-results');
    const searchResultsGrid = searchResultsSection.querySelector('.product-grid');
    const cartItemCount = document.getElementById('cartItemCount');
    const searchInput = document.getElementById('searchInput');
    const userId = localStorage.getItem('userId');
    const logoutButton = document.getElementById('logoutButton');

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = 'login.html';
    });
    // Function to get items from localStorage
    function getItemsFromLocalStorage() {
        const products = localStorage.getItem('products');
        return products ? JSON.parse(products) : [];
    }

    // Function to add an item to the cart
    async function addToCart(productId) {
        try {
            const response = await fetch('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, productId, quantity: 1 })
            });
            const data = await response.json();
            if (data.success) {
                updateCartItemCount();
                alert('Item added to cart!');
            } else {
                alert('Failed to add item to cart.');
            }
        } catch (error) {
            console.error('Error adding item to cart:', error);
            alert('Error adding item to cart.');
        }
    }

    // Function to update cart item count
    async function updateCartItemCount() {
        try {
            const response = await fetch(`http://localhost:3000/api/cart?userId=${userId}`);
            const data = await response.json();
            cartItemCount.textContent = data.items.length;
        } catch (error) {
            console.error('Error fetching cart items:', error);
        }
    }

    function saveSearchHistory(userId, searchQuery) {
        fetch('http://localhost:3000/api/search-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, searchQuery })
        });
    }

    // Function to display search results
    function displaySearchResults(searchQuery) {
        const products = getItemsFromLocalStorage();
        const searchResults = products.filter(product => 
            product.name.toLowerCase().includes(searchQuery) ||
            product.description.toLowerCase().includes(searchQuery)
        );

        searchResultsGrid.innerHTML = '';
        if (searchResults.length > 0) {
            searchResults.forEach(product => {
                const productElement = document.createElement('div');
                productElement.className = 'product';
                productElement.innerHTML = `
                    <img src="${product.image_url}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p>$${product.price.toFixed(2)}</p>
                    <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
                    <button class="view-details" data-id="${product.id}">View Details</button>
                `;
                searchResultsGrid.appendChild(productElement);
            });

            document.querySelectorAll('.add-to-cart').forEach(button => {
                button.addEventListener('click', (event) => {
                    const productId = event.target.getAttribute('data-id');
                    addToCart(productId);
                });
            });

            document.querySelectorAll('.view-details').forEach(button => {
                button.addEventListener('click', (event) => {
                    const productId = event.target.getAttribute('data-id');
                    window.location.href = `product-details.html?id=${productId}`;
                });
            });
        } else {
            searchResultsGrid.innerHTML = '<p>No products found.</p>';
        }
    }

    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const searchQuery = searchInput.value.trim().toLowerCase();
            if (searchQuery) {
                window.location.href = `search-results.html?query=${encodeURIComponent(searchQuery)}`;
            }
        }
    });

    displaySearchResults(searchQuery);
    updateCartItemCount();
});