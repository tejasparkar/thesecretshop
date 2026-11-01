import { Routes, Route } from 'react-router-dom';
import StoreLayout from './components/StoreLayout.jsx';
import { RequireAuth, RequireAdmin } from './components/Guards.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import ProductPage from './pages/Product.jsx';
import Checkout from './pages/Checkout.jsx';
import { Login, Register } from './pages/Auth.jsx';
import MyOrders from './pages/MyOrders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminOrders from './pages/admin/Orders.jsx';
import AdminCategories from './pages/admin/Categories.jsx';
import AdminProducts from './pages/admin/Products.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="shop/:slug" element={<Shop />} />
        <Route path="product/:slug" element={<ProductPage />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="account/orders" element={<RequireAuth><MyOrders /></RequireAuth>} />
        <Route path="account/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="products" element={<AdminProducts />} />
      </Route>
    </Routes>
  );
}
