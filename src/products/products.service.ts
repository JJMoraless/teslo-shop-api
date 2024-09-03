import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUuId } from 'uuid';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const newProduct = this.productRepository.create(createProductDto);
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
        .createQueryBuilder()
        .where('UPPER(title) = :title OR slug = :slug', {
          title: termQuery.toUpperCase(),
          slug: termQuery.toLowerCase(),
        })
        .getOne();
    }

    if (!productFound) {
      throw new NotFoundException('Product not found' + termQuery);
    }

    return productFound;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const productUpdated = await this.productRepository.preload({
      id: id,
      ...updateProductDto,
    });

    if (!productUpdated) {
      throw new NotFoundException('Product not found');
    }

    try {
      await this.productRepository.save(productUpdated)
      return productUpdated;
    } catch (error) {
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
