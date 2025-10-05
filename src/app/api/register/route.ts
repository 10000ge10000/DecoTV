/* eslint-disable no-console,@typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { getConfig } from '@/lib/config';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * 注册接口
 * 仅在数据库存储模式（redis / upstash / kvrocks）下开放，
 * localstorage 模式不支持注册。
 * 同时受开关变量 NEXT_PUBLIC_ENABLE_REGISTER 控制（默认关闭）。
 *
 * POST /api/register
 * body: { username: string, password: string }
 */
export async function POST(req: NextRequest) {
  const storageType =
    (process.env.NEXT_PUBLIC_STORAGE_TYPE as
      | 'localstorage'
      | 'redis'
      | 'upstash'
      | 'kvrocks'
      | undefined) || 'localstorage';

  // 全局开关：默认关闭注册，仅当 NEXT_PUBLIC_ENABLE_REGISTER === 'true' 时开启
  const enableRegister = process.env.NEXT_PUBLIC_ENABLE_REGISTER === 'true';
  if (!enableRegister) {
    return NextResponse.json({ error: '注册未开放' }, { status: 403 });
  }

  if (storageType === 'localstorage') {
    return NextResponse.json(
      { error: '当前存储模式不支持注册' },
      { status: 400 }
    );
  }

  try {
    const { username, password } = (await req.json()) as {
      username?: string;
      password?: string;
    };

    // 参数校验
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: '密码不能为空' }, { status: 400 });
    }

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    // 用户名规则：3-32 长度，字母数字下划线和中划线
    const usernameValid =
      trimmedUser.length >= 3 &&
      trimmedUser.length <= 32 &&
      /^[a-zA-Z0-9_-]+$/.test(trimmedUser);
    if (!usernameValid) {
      return NextResponse.json(
        { error: '用户名格式不合法（3-32位，仅字母、数字、下划线、短横线）' },
        { status: 400 }
      );
    }

    // 密码规则：至少 6 位
    if (trimmedPass.length < 6) {
      return NextResponse.json(
        { error: '密码长度不得少于 6 位' },
        { status: 400 }
      );
    }

    // 禁止注册为站长用户名
    if (trimmedUser === process.env.USERNAME) {
      return NextResponse.json({ error: '该用户名不可注册' }, { status: 403 });
    }

    // 检查是否已存在
    const existed = await db.checkUserExist(trimmedUser);
    if (existed) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 409 });
    }

    // 注册用户
    await db.registerUser(trimmedUser, trimmedPass);

    // 将用户加入管理员配置（以确保服务端配置里能看到新用户）
    const adminConfig = await getConfig();
    const alreadyInConfig = adminConfig.UserConfig.Users.find(
      (u: any) => u.username === trimmedUser
    );
    if (!alreadyInConfig) {
      adminConfig.UserConfig.Users.push({
        username: trimmedUser,
        role: 'user',
        banned: false,
      } as any);
      await db.saveAdminConfig(adminConfig);
    }

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('注册接口异常:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
