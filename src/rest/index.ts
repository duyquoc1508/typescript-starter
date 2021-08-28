// rest full api
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

app.get('/', async (req: Request, res: Response) => {
	const users = await prisma.user.findMany({
		include: {
			posts: true,
		},
	});
	res.json(users);
});

app.post('/', async (req: Request, res: Response) => {
	const { name, email } = req.body;
	const user = await prisma.user.create({
		data: {
			name,
			email,
		},
	});
	res.json(user);
});

app.put('/:id', async (req: Request, res: Response) => {
	const { id } = req.params;
	const dataUpdate = req.body;
	const userUpdated = await prisma.user.update({
		where: {
			id,
		},
		data: dataUpdate,
	});
	res.json(userUpdated);
});

app.delete('/:id', async (req: Request, res: Response) => {
	const { id } = req.params;
	const userDeleted = await prisma.user.delete({
		where: {
			id,
		},
	});
	res.json(userDeleted);
});

app.listen(3000, () => {
	console.log('Server running at 3000');
});
