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
todoList.post('/create', async (c) => {
    const data = await c.req.json();
    const { title, description } = data;

    if (!title) {
        return APIError(c, false, "Vui lòng điền đầy đủ trường dữ liệu [title]!");
    }

    const id = await redis.incr("next_item_id");
    await redis.set(`item:${id}`, JSON.stringify({ id, title, description }));
    return c.json({ status: true, msg: "Tạo thành công", data: { id, title, description } });
});

// [GET] Lấy item theo ID hoặc lấy tất cả
todoList.get('/get/:id?', async (c) => {
    const idParam = c.req.param('id');
    if (idParam) {
        // Lấy item theo ID
        const id = `item:${idParam}`;
        const existsId: any = await redis.get(id);

        if (!existsId) {
            return c.json({ status: false, msg: `Không tìm thấy item với ID: ${idParam}` });
        }

        return c.json({ status: true, msg: "Lấy dữ liệu thành công", data: { ...JSON.parse(existsId), id } });
    } else {
        const keys = await redis.keys('item:*');
        const allItems = await Promise.all(
            keys.map(async (key) => {
                const value: any = await redis.get(key);
                return { id: key.split(':')[1], ...JSON.parse(value) };
            })
        );

        allItems.sort((a, b) => b?.id - a?.id);

        return c.json({ status: true, msg: "Lấy tất cả dữ liệu thành công", data: allItems });
    }
});


// [PUT] - Cập nhật item
todoList.put('/update/:id', async (c) => {
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
    const ids = c.req.param("id")?.split("");
    if (!ids || ids?.length == 0) {
        return APIError(c, false, "[ID] bị thiếu!");
    }
    try {
        await Promise.all(ids.map((id: string) => redis.del(`item:${id}`)));
        return c.json({ status: true, msg: "Xoá thành công" });
    } catch (error) {
        return APIError(c, false, "[ID] không tồn tại hoặc có lỗi trong quá trình xử lý!");
    }
});

// [POST] - Sắp xếp item theo option [desc or asc]
todoList.post('/sort', async (c) => {
    const { option } = await c.req.json();

    if (!option) {
        return APIError(c, false, "[Option] bị thiếu!");
    }
    if (option !== "desc" && option !== "asc") {
        return APIError(c, false, "Giá trị 'option' phải là 'desc' hoặc 'asc'!");
    }

    const keys: any = await redis.keys("item:*");
    const allItems = await Promise.all(
        keys.map(async (key: string) => {
            const value: any = await redis.get(key);
            return { ...JSON.parse(value), id: key.split(':')[1] }; // Tách phần ID từ key
        })
    );

    allItems.sort((a, b) => {
        return option === "asc"
            ? a.id - b.id
            : b.id - a.id;
    });

    return c.json({ data: allItems, msg: "Sắp xếp thành công", status: true })
});

export default todoList;