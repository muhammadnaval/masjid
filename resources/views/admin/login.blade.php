<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Login — Masjid Display</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
<div class="w-full max-w-md bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
<div class="text-center space-y-2"><div class="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-3xl">🕌</div><h1 class="text-2xl font-black text-white">Masjid Display</h1><p class="text-xs text-slate-400">Masuk ke Panel Pengurus Admin</p></div>
@if($errors->any())<div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold">{{ $errors->first() }}</div>@endif
<form method="POST" action="{{ route('admin.login.post') }}" class="space-y-4">@csrf
<div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Email</label><input type="email" name="email" value="{{ old('email') }}" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" placeholder="admin@masjid.test"></div>
<div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Password</label><input type="password" name="password" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" placeholder="••••••••"></div>
<button type="submit" class="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm rounded-xl">Masuk Ke Dashboard</button>
</form></div></body></html>
