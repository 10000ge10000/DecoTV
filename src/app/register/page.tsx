/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { useSite } from '@/components/SiteProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

function RegisterPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { siteName } = useSite();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageType =
        (window as any).RUNTIME_CONFIG?.STORAGE_TYPE || 'localstorage';
      const enable = (window as any).RUNTIME_CONFIG?.ENABLE_REGISTER === true;

      // 全局开关：未开启时禁用页面
      if (!enable) {
        setDisabled(true);
        setError('注册未开放');
        return;
      }

      // localstorage 模式禁用
      if (storageType === 'localstorage') {
        setDisabled(true);
        setError('当前存储模式不支持注册');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;

    setError(null);

    if (!username || !password || !confirm) {
      setError('请填写完整信息');
      return;
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致');
      return;
    }
    if (password.length < 6) {
      setError('密码长度不得少于 6 位');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? '注册失败');
        return;
      }

      // 注册成功后自动登录
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (loginRes.ok) {
        const redirect = searchParams.get('redirect') || '/';
        router.replace(redirect);
      } else {
        router.replace('/login');
      }
    } catch (_) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='relative min-h-screen flex items-center justify-center px-4 overflow-hidden'>
      <div className='absolute top-4 right-4'>
        <ThemeToggle />
      </div>

      <div className='relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b from-white/90 via-white/70 to-white/40 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-900/40 backdrop-blur-xl shadow-2xl p-10 dark:border dark:border-zinc-800'>
        <h1 className='tracking-tight text-center text-4xl font-extrabold mb-8 bg-clip-text neon-text neon-flicker'>
          {siteName}
        </h1>

        <form onSubmit={handleSubmit} className='space-y-8'>
          <div>
            <label htmlFor='username' className='sr-only'>
              用户名
            </label>
            <input
              id='username'
              type='text'
              autoComplete='username'
              className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur'
              placeholder='输入用户名（3-32位，字母/数字/下划线/中划线）'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={disabled || loading}
            />
          </div>

          <div>
            <label htmlFor='password' className='sr-only'>
              密码
            </label>
            <input
              id='password'
              type='password'
              autoComplete='new-password'
              className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur'
              placeholder='输入密码（至少6位）'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={disabled || loading}
            />
          </div>

          <div>
            <label htmlFor='confirm' className='sr-only'>
              确认密码
            </label>
            <input
              id='confirm'
              type='password'
              autoComplete='new-password'
              className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur'
              placeholder='再次输入密码'
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={disabled || loading}
            />
          </div>

          {error && (
            <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
          )}

          <button
            type='submit'
            disabled={disabled || loading || !username || !password || !confirm}
            className='inline-flex w-full justify-center rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 neon-flicker'
          >
            {loading ? '注册中...' : '注册'}
          </button>

          <div className='mt-4 text-center text-sm text-gray-500 dark:text-gray-400'>
            已有账号？
            <Link
              href='/login'
              className='ml-1 text-purple-600 hover:underline dark:text-purple-400'
            >
              去登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPageClient />
    </Suspense>
  );
}
