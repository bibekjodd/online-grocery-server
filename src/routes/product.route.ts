import {
  createProduct,
  deleteProduct,
  getProductDetails,
  queryProducts,
  updateProduct
} from '@/controllers/product.controller';
import { Router } from 'express';

const router = Router();
export const productRoute = router;

router.post('/product', createProduct);
router
  .route('/product/:id')
  .get(getProductDetails)
  .put(updateProduct)
  .delete(deleteProduct);
router.get('/products', queryProducts);
