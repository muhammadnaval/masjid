<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title>{{ $donation->title }} — Masjid Al-Hidayah Siteba</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
    <main class="w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-slate-900 p-8 text-center shadow-2xl shadow-emerald-950/40">
        <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-4xl">🕌</div>
        <p class="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">Masjid Al-Hidayah Siteba</p>
        <h1 class="text-2xl font-bold text-white">{{ $donation->title }}</h1>
        @if($donation->description)
            <p class="mt-3 text-sm leading-6 text-slate-300">{{ $donation->description }}</p>
        @endif

        @if($donation->account_name || $donation->bank_name || $donation->account_number)
            <div class="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-5 text-left">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Rekening Donasi</p>
                @if($donation->bank_name)<p class="mt-3 text-sm text-slate-300">Bank: <strong class="text-white">{{ $donation->bank_name }}</strong></p>@endif
                @if($donation->account_name)<p class="mt-1 text-sm text-slate-300">Atas nama: <strong class="text-white">{{ $donation->account_name }}</strong></p>@endif
                @if($donation->account_number)<p class="mt-1 text-sm text-slate-300">Nomor: <strong class="text-emerald-300">{{ $donation->account_number }}</strong></p>@endif
            </div>
        @endif

        <p class="mt-7 text-xs text-slate-500">Terima kasih atas dukungan dan amal terbaik Anda.</p>
    </main>
</body>
</html>
