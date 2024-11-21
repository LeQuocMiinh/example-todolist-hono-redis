import typia, { tags } from 'typia';
import type { Test } from '../interfaces/UIindex.js';

export const validate = typia.createValidate<Test>();