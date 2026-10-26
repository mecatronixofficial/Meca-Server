import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { applySearch, ListQueryDto, ListResult, paginate } from '../common/pagination';
import { StorageService } from '../storage/storage.service';
import { CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';
import { Blog } from './entities/blog.entity';

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(Blog) private readonly blogs: Repository<Blog>,
    private readonly storage: StorageService,
  ) {}

  create(dto: CreateBlogDto) {
    return this.blogs.save(this.blogs.create(dto));
  }

  findAll(query: ListQueryDto): Promise<ListResult<Blog>> {
    const qb = this.blogs.createQueryBuilder('b').orderBy('b.createdAt', 'DESC');
    return paginate(applySearch(qb, ['b.blog_name', 'b.short_description'], query.search), query);
  }

  async findOne(id: string) {
    const blog = await this.blogs.findOneBy({ id });
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  async update(id: string, dto: UpdateBlogDto) {
    const blog = await this.findOne(id);
    return this.blogs.save(Object.assign(blog, dto));
  }

  /** Deletes the blog and its uploaded images (cover images and section images). */
  async remove(id: string) {
    const blog = await this.findOne(id);
    await this.blogs.remove(blog);
    await this.storage.removeQuietly([...blog.blog_images, ...blog.blog_descriptions.map((section) => section.image)]);
  }
}
