import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductImage } from './entities';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUuId } from 'uuid';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const { images = [], ...productDto } = createProductDto;

    try {
      const newProduct = this.productRepository.create({
        ...productDto,
        images: images.map((imageStr) => this.productImageRepository.create({ url: imageStr })),
      });

      await this.productRepository.save(newProduct);
      return newProduct;
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, page = 1 } = paginationDto;

    try {
      const productsFound = await this.productRepository.find({
        take: limit,
        skip: (page - 1) * limit,
        relations: {
          images: true,
        },
      });

      return productsFound;
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async findOne(termQuery: string) {
    let productFound: Product;

    if (isUuId(termQuery)) {
      productFound = await this.productRepository.findOneBy({ id: termQuery });
    } else {
      productFound = await this.productRepository
        .createQueryBuilder('product')
        .where('UPPER(product.title) = :title OR product.slug = :slug', {
          title: termQuery.toUpperCase(),
          slug: termQuery.toLowerCase(),
        })
        .leftJoinAndSelect('product.images', 'prod_images')
        .getOne();
    }

    if (!productFound) {
      throw new NotFoundException('Product not found' + termQuery);
    }

    return productFound;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images: imagesDto, ...productDto } = updateProductDto;
    const productUpdated = await this.productRepository.preload({
      id,
      ...productDto,
    });

    if (!productUpdated) {
      throw new NotFoundException('Product not found');
    }

    // * transaction borrar iamgenes anteriores y agregar las nuevas
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (imagesDto) {
        queryRunner.manager.delete(ProductImage, { product: id });
        productUpdated.images = imagesDto.map((imageStr) => this.productImageRepository.create({ url: imageStr }));
      } else {
        productUpdated.images = await this.productImageRepository.findBy({product: { id }});
      }

      await queryRunner.manager.save(productUpdated);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return productUpdated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBExeptions(error);
    }
  }

  async remove(id: string) {
    const infoProductDeleted = await this.productRepository.delete({ id });
    if (infoProductDeleted.affected === 0) {
      throw new NotFoundException('Product not found');
    }
    return infoProductDeleted;
  }

  private handleDBExeptions(error: any) {
    if (error?.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error?.message);
    throw new Error(error?.message);
  }
}
