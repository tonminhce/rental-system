import 'reflect-metadata';
import { HttpException, NotFoundException } from '@nestjs/common';
import { UniqueConstraintError } from 'sequelize';

// jest cannot resolve the `src/...` baseUrl import or winston's config, so both
// collaborators post.service pulls in are mocked at module level.
jest.mock(
  'src/utils/sequelize-error.util',
  () => ({
    SequelizeErrorUtil: {
      formatSequelizeError: (error: Error) => error.message,
    },
  }),
  { virtual: true },
);
jest.mock('../../shared/utils/log.util', () => ({
  loggerUtil: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  Logger: class {},
}));

import { PostService } from './post.service';

describe('PostService', () => {
  const makeService = () => {
    const postModel = {
      findByPk: jest.fn(),
      create: jest.fn(),
      findAndCountAll: jest.fn(),
    };
    const imageModel = { bulkCreate: jest.fn() };
    const favoriteModel = { create: jest.fn(), findOne: jest.fn() };
    const sequelize = { transaction: jest.fn(async (cb: any) => cb({})) };
    const service = new PostService(
      postModel as any,
      imageModel as any,
      favoriteModel as any,
      sequelize as any,
    );
    return { service, postModel, imageModel, favoriteModel, sequelize };
  };

  it('addFavorite treats a concurrent insert (unique violation) as success', async () => {
    const { service, postModel, favoriteModel } = makeService();
    postModel.findByPk.mockResolvedValue({ id: 7 });
    favoriteModel.create.mockRejectedValue(
      new UniqueConstraintError({ message: 'duplicate key' } as any),
    );
    await expect(service.addFavorite(7, 3)).resolves.toBe(true);
  });

  it('addFavorite still surfaces non-duplicate DB errors', async () => {
    const { service, postModel, favoriteModel } = makeService();
    postModel.findByPk.mockResolvedValue({ id: 7 });
    favoriteModel.create.mockRejectedValue(new Error('connection lost'));
    await expect(service.addFavorite(7, 3)).rejects.toThrow(HttpException);
  });

  it('keeps an intentional 404 instead of flattening it into a 400', async () => {
    const { service, postModel } = makeService();
    postModel.findByPk.mockResolvedValue(null);
    await expect(service.getPost(999, null)).rejects.toThrow(NotFoundException);
  });

  it('createPost persists userId with post+images in one transaction', async () => {
    const { service, postModel, imageModel } = makeService();
    postModel.create.mockResolvedValue({ id: 11, get: () => ({ id: 11 }) });
    postModel.findByPk.mockResolvedValue({ get: () => ({ id: 11 }) });

    await service.createPost(
      { name: 'n', price: 1, source: 'crawler', images: ['a.jpg'] } as any,
      5,
    );

    expect(postModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 5, status: 'active', source: 'crawler' }),
      expect.objectContaining({ transaction: expect.anything() }),
    );
    expect(imageModel.bulkCreate).toHaveBeenCalledWith(
      [{ rentalId: 11, url: 'a.jpg' }],
      expect.objectContaining({ transaction: expect.anything() }),
    );
  });
});
