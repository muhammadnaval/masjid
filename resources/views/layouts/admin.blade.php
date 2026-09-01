<!DOCTYPE html>
<html lang="id" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Admin') — Masjid Display</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <style>[x-cloak] { display: none !important; }</style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 flex">
    <aside class="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0 min-h-screen">
        <div>
            <div class="flex items-center gap-3 px-3 py-3 mb-6 border-b border-slate-800">
                <div class="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400"><span class="text-xl">🕌</span></div>
                <div><h2 class="text-sm font-bold text-white">Masjid Display</h2><span class="text-[11px] text-emerald-400 font-semibold">Panel Admin</span></div>
            </div>
            <nav class="space-y-1">
                @php($navItems = [
                    ['route'=>'admin.dashboard','label'=>'Dashboard'], ['route'=>'admin.profile.edit','label'=>'Profil Masjid'],
                    ['route'=>'admin.schedule.index','label'=>'Jadwal Sholat'], ['route'=>'admin.iqamah.edit','label'=>'Iqamah'],
                    ['route'=>'admin.syuruq.edit','label'=>'Syuruq'], ['route'=>'admin.audio.edit','label'=>'Audio'],
                    ['route'=>'admin.media.index','label'=>'Slide & Media'], ['route'=>'admin.donation.edit','label'=>'QR Donasi'],
                    ['route'=>'admin.running-text.index','label'=>'Running Text'], ['route'=>'admin.agenda.index','label'=>'Agenda'],
                    ['route'=>'admin.theme.edit','label'=>'Tema & Desain'], ['route'=>'admin.hijri.edit','label'=>'Hijriyah'],
                    ['route'=>'admin.countdown.edit','label'=>'Countdown'], ['route'=>'admin.friday.edit','label'=>'Jumat'],
                    ['route'=>'admin.account.edit','label'=>'Akun'],
                ])
                @foreach($navItems as $item)
                    <a href="{{ route($item['route']) }}" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition {{ request()->routeIs($item['route']) ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60' }}">
                        <span>{{ $item['label'] }}</span>
                    </a>
                @endforeach
            </nav>
        </div>
        <form method="POST" action="{{ route('admin.logout') }}" class="pt-4 border-t border-slate-800">
            @csrf
            <button type="submit" class="w-full py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-xl transition">Keluar</button>
        </form>
    </aside>
    <div class="flex-1 flex flex-col min-h-screen">
        <header class="bg-slate-900/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
            <h1 class="text-lg font-bold text-white">@yield('header', 'Dashboard')</h1>
            <div class="flex items-center gap-3"><span class="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs rounded-full">Online</span><span class="text-xs text-slate-400">{{ Auth::user()->email ?? '' }}</span></div>
        </header>
        <main class="p-6 lg:p-8 flex-1">
            @if(session('success')) <div x-data="{show:true}" x-show="show" x-init="setTimeout(() => show=false, 3000)" class="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm rounded-xl">{{ session('success') }}</div> @endif
            @if(session('error')) <div class="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl">{{ session('error') }}</div> @endif
            @if($errors->any()) <div class="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl">{{ $errors->first() }}</div> @endif
            @yield('content')
        </main>
    </div>
</body>
</html>
