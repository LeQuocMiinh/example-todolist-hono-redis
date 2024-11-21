import { Hono } from "hono";
import Redis from "ioredis";

const redis = new Redis({
    port: 6379,
    host: '127.0.0.1',
    password: 'minhcute123',
});

const APIError = (c: any, status: true | false, msg: string) => {
    return c.json({
        status: status,
        msg: msg
    }, 400);
}

const todoList = new Hono();

// [POST] - Tạo item
todoList.post('/post', async (c) => {
    const data = await c.req.json();
    const { title, description } = data;

    if (!title) {
        return APIError(c, false, "Vui lòng điền đầy đủ trường dữ liệu [title]!");
    }

    const id = await redis.incr("next_item_id");

    await redis.set(`item:${id}`, JSON.stringify({ id, title, description }));

    return c.json({ status: true, msg: "Tạo thành công", data: { id, title, description } });
});

// [GET] Lấy item theo ID
todoList.get('/get/:id', async (c) => {
    const id = c.req.param('id');
    if (!id) {
        return APIError(c, false, "[ID] bị thiếu!");
    }
    const existsId: any = await redis.get(`item:${id}`);
    if (!existsId) {
        return APIError(c, false, "[ID] không tồn tại!");
    }

    return c.json({ status: true, msg: "Lấy dữ liệu thành công", data: { ...JSON.parse(existsId), id } });
});

// [PUT] 
todoList.put('/put/:id', async (c) => {
    const id = c.req.param("id");
    const params = await c.req.json();
    const { title, description } = params;
    if (!id) {
        return APIError(c, false, "[ID] bị thiếu!");
    }

    const existsId: any = await redis.get(`item:${id}`);
    if (!existsId) {
        return APIError(c, false, "Item không tồn tại");
    }

    await redis.set(`item:${id}`, JSON.stringify({ title, description }));
    const updated = { ...JSON.parse(existsId), id, title, description };
    return c.json({ status: true, msg: "Cập nhật dữ liệu thành công", data: updated });

})

// [DELETE] - Xoá item theo ID
todoList.delete('/delete/:id', async (c) => {
    const id = c.req.param('id');
    if (!id) {
        return APIError(c, false, "[ID] bị thiếu!");
    }

    const existsId: any = await redis.del(`item:${id}`);
    if (!existsId) {
        return APIError(c, false, "[ID] không tồn tại!");
    }
    return c.json({ status: true, msg: "Xoá thành công" });
});


export default todoList;