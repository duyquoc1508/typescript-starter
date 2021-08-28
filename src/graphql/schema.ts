import { makeSchema, objectType, arg, nonNull, asNexusMethod, inputObjectType } from 'nexus';
import { Context } from './context';
import { DateTimeResolver } from 'graphql-scalars';
import { ObjectDefinitionBlock } from 'nexus/dist/blocks';

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

const Query = objectType({
	name: 'Query',
	definition(t) {
		t.nonNull.list.nonNull.field('allUsers', {
			type: 'User',
			resolve: (_parent, _args, context: Context) => {
				return context.prisma.user.findMany();
			},
		});
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
	definition(t: ObjectDefinitionBlock<'Mutation'>) {
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
	},
});

export const schema = makeSchema({
	types: [User, Post, Query, Mutation, DateTime, UserCreateInput, PostCreateInput],
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
