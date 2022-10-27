import {RequestHandler} from 'express';
import parseurl from 'parseurl';
import send from 'send';
import {assertTruthy} from '../../common/check/truthy';

export const staticHandler: RequestHandler = async (req, res, next) => {
  send(req, assertTruthy(parseurl(req)?.pathname), {root: 'static'}).pipe(res)
};
