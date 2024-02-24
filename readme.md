## Online Grocery Store SERVER

#### Full featured online grocery store server with auth, ownership, listing, buying and selling along with sales activities Apis

### Tech Stack

- #### Nodejs
- #### Expressjs
- #### Typescript
- #### Postgresql

### Features

- #### Credentials Autentication
- #### Google Authentication
- #### Profile update/delete
- #### Product listing
- #### Personalized dashboard

### Prerequisites

- #### See .env.example for required env properties

## API Endpoints

- ### User APIs

```ts
// Register User
POST '/api/register'
// required properties
body = {
  name: string
  email: string
  password: string
}
```

```ts
// Login User
POST '/api/login'
// required properties
body = {
  email: string
  password: string
}
```

```ts
// Google Login
GET '/api/login/google'
```

```ts
// Logout User
GET '/api/logout'
```

```ts
// Get Profile
GET '/api/profile'
```

```ts
// Update Profile
PUT '/api/profile'
body = {
  name: string
  image: string
  state: string
  district: string
  area: string
  hasOptedNotification: boolean
}
```

```ts
// Delete Profile
DELETE '/api/profile'
```

```ts
// Request Email Verification Code
GET '/api/verify-email'
```

```ts
// Verify Email
POST '/api/verify-email'
body = {
  code:string
}
```

### Notification APIs

```ts
GET '/api/notifications'
```

### Product APIs

```ts
// Add Product
POST '/api/product'
body = {
  title: string
  description: string
  image: string
  category: string
  price: number
  stock: number
  discount: number
}
```

```ts
// Get Product Details
GET '/api/product/:id' // id => productId
```

```ts
// Update Product
PUT '/api/product/:id' // id => productId
body = {
  title: string
  description: string
  image: string
  category: string
  price: number
  stock: number
  discount: number
}
```

```ts
// Delete Product
DELETE '/api/product/:id' // id => productId
```

```ts
// Query products
GET '/api/products'
query = {
  q: string
  page: string
  limit: string
  owner: string
  category: string
  orderby: 'price_asc' | 'price_desc'
  price_gte: string
  price_lte: string
  verified_seller: string
}
```

### Review APIs

```ts
// Write or update Review on User
POST '/api/review/:id' // id => userId
body = {
  title: string
  text: string
  rating: number
}
```

```ts
// Get reviews of user
GET '/api/review/:id' // id => userId
```

```ts
// Delete review
DELETE '/api/review/:id' // id => userId
```

### Order APIs

```ts
// Place an order
POST '/api/order/:id' // id => productId
body = {
  address: string
  paymentType: 'cash-on-delivery' | 'online'
  quantity: number
}
```

```ts
// Update Order
PUT '/api/order/:id' // id => orderId
body = {
  paid: boolean
  delivered: boolean
}
```

```ts
// Cancel Order
DELETE '/api/order/:id' // id => orderId
```
