import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity({name: 'product_images'})
export class ProductImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url:string

  // {onDelete: 'CASCADE'} si se borra unn producto se borran las imagenes tambien asociadas
  @ManyToOne(() => Product, (product) => product.images, {onDelete: 'CASCADE'}) 
  product: Product;
}
