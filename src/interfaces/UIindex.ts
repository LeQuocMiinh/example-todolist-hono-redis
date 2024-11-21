import typia, { tags } from 'typia';

export interface Test {
    email: string & tags.Format<"email">;
}