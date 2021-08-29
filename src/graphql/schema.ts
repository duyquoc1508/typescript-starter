import {
	makeSchema,
	objectType,
	arg,
	nonNull,
	asNexusMethod,
	inputObjectType,
	stringArg,
} from 'nexus';
import { nexusSchemaPrisma } from 'nexus-plugin-prisma/schema'; // auto create CURD
import { DateTimeResolver } from 'graphql-scalars';
import { Context } from './context';

export const DateTime = asNexusMethod(DateTimeResolver, 'date');

const Post = objectType({
	name: 'Post',
	definition(t) {
		t.nonNull.id('id');
		t.nonNull.field('createdAt', { type: 'DateTime' });
		t.nonNull.field('updatedAt', { type: 'DateTime' });
		t.nonNull.string('title');
		t.string('content');
		t.nonNull.boolean('published');
		t.nonNull.int('viewCount');
		t.field('author', {
			type: 'User',
			resolve: (parent, _, context: Context) => {
				return context.prisma.post
					.findUnique({
						where: { id: parent.id },
					})
					.author();
			},
		});
	},
});

const User = objectType({
	name: 'User',
	definition(t) {
		t.nonNull.id('id');
		t.nonNull.string('email');
		t.string('name');
		t.list.field('posts', {
			type: 'Post',
			resolve: (parent, _, ctx: Context) => {
				return ctx.prisma.user
					.findUnique({
						where: {
							id: parent.id || undefined,
						},
					})
					.posts();
			},
		});
	},
});

const Product = objectType({
	name: 'Product',
	definition(t) {
		t.nonNull.id('id');
		t.nonNull.string('name');
		t.nonNull.int('price');
	},
});

const Query = objectType({
	name: 'Query',
	definition(t) {
		t.nonNull.list.field('allUsers', {
			type: 'User',
			resolve: (_parent, _args, context: Context) => {
				return context.prisma.user.findMany();
			},
		});

		t.nonNull.list.field('allPosts', {
			type: Post,
			resolve: (_parent, _args, context: Context) => {
				return context.prisma.post.findMany();
			},
		});

		t.nonNull.field('postById', {
			type: Post,
			args: {
				id: nonNull(stringArg()),
			},
			resolve: (_parent, args, context: Context) => {
				return context.prisma.post.findUnique({
					where: {
						id: args.id || undefined,
					},
				});
			},
		});

		// t.crud.comment();
	},
});

const PostCreateInput = inputObjectType({
	name: 'PostCreateInput',
	definition(t) {
		t.nonNull.string('title');
		t.nonNull.string('content');
	},
});

const UserCreateInput = inputObjectType({
	name: 'UserCreateInput',
	definition(t) {
		t.nonNull.string('email');
		t.nonNull.string('name');
		t.list.field('posts', {
			type: PostCreateInput,
		});
	},
});

const Mutation = objectType({
	name: 'Mutation',
	definition(t) {
		t.nonNull.field('createUser', {
			type: User,
			args: {
				data: nonNull(
					arg({
						type: UserCreateInput,
					}),
				),
			},
			resolve: (_, args, ctx: Context) => {
				const postData = args.data.posts?.map((post: any) => {
					return {
						title: post.title,
						content: post.content,
					};
				});
				return ctx.prisma.user.create({
					data: {
						name: args.data.name,
						email: args.data.email,
						posts: {
							create: postData,
						},
					},
				});
			},
		});

		t.field('togglePublishPost', {
			type: Post,
			args: {
				id: nonNull(stringArg()),
			},
			resolve: async (_parent, args, ctx: Context) => {
				const post = await ctx.prisma.post.findUnique({
					where: {
						id: args.id,
					},
					select: {
						published: true,
					},
				});
				if (!post) {
					return {
						message: 'Không tìm thất thông tin bài viết',
					};
				}
				return ctx.prisma.post.update({
					where: {
						id: args.id,
					},
					data: {
						published: !post.published,
					},
				});
			},
		});

		t.field('incrementPostViewCount', {
			type: Post,
			args: {
				id: nonNull(stringArg()),
			},
			resolve: (_parent, args, ctx: Context) => {
				return ctx.prisma.post.update({
					where: {
						id: args.id,
					},
					data: {
						viewCount: {
							increment: 1,
						},
					},
				});
			},
		});

		t.field('createPost', {
			type: 'Post',
			args: {
				data: nonNull(
					arg({
						type: PostCreateInput,
					}),
				),
				authorId: nonNull(stringArg()),
			},
			resolve: (_parent, args, context: Context) => {
				return context.prisma.post.create({
					data: {
						title: args.data.title,
						content: args.data.content,
						author: {
							connect: { id: args.authorId },
						},
					},
				});
			},
		});
	},
});

const nexusPrisma = nexusSchemaPrisma({
	experimentalCRUD: true,
	paginationStrategy: 'prisma',
	//prismaClient: (ctx: Context) => ctx.prisma,
});

export const schema = makeSchema({
	types: { Query, Mutation, DateTime, Product },
	// plugins: [nexusPrisma], // auto create curd
	// types: [User, Post, Query, Mutation, DateTime, UserCreateInput, PostCreateInput],
	outputs: {
		schema: __dirname + '/../../schema.graphql',
		typegen: __dirname + '/generated/nexus.ts',
	},
	contextType: {
		module: require.resolve('./context'),
		export: 'Context',
	},
	sourceTypes: {
		modules: [
			{
				module: '@prisma/client',
				alias: 'prisma',
			},
		],
	},
});
