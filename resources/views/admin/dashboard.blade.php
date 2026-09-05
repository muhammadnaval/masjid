@extends('layouts.admin')
@section('title', 'Dashboard')
@section('header', 'Dashboard Pengurus Masjid')

@section('content')
<div class="space-y-6">
    <div class="bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border border-emerald-500/30 p-6 rounded-3xl">
        <h2 class="text-2xl font-black text-white">{{ $profile->name ?? 'Masjid Display' }}</h2>
        <p class="text-sm text-slate-300 mt-1">{{ $profile->address ?? '-' }}</p>
    </div>

    @if($latestLog)
    <div class="p-4 rounded-2xl border text-xs font-semibold {{ $latestLog->status === 'failed' ? 'bg-red-950/40 border-red-500/40 text-red-300' : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' }}">
        <strong>Log:</strong> {{ $latestLog->message }}
        <span class="float-right text-slate-400">{{ $latestLog->created_at->format('H:i') }} WIB</span>
    </div>
    @endif

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span class="text-xs text-slate-400">Kota Aktif</span>
            <h4 class="text-lg font-bold text-white mt-1">{{ $location->city_name ?? '-' }}</h4>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span class="text-xs text-slate-400">Slide Media Aktif</span>
            <h4 class="text-2xl font-black text-white mt-1">{{ $activeMediaCount }}</h4>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span class="text-xs text-slate-400">Running Text</span>
            <h4 class="text-2xl font-black text-white mt-1">{{ $activeTextCount }}</h4>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span class="text-xs text-slate-400">Tema Aktif</span>
            <h4 class="text-base font-bold text-white mt-1">{{ $theme->theme_name ?? '-' }}</h4>
        </div>
    </div>

    @if($schedule)
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <h3 class="text-sm font-bold text-emerald-400 mb-4">Jadwal Sholat Hari Ini</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            @foreach(['subuh','dzuhur','ashar','maghrib','isya'] as $prayer)
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span class="text-xs text-slate-400 block">{{ ucfirst($prayer) }}</span>
                <span class="text-lg font-bold text-emerald-300 block">{{ substr($schedule->$prayer ?? '--', 0, 5) }}</span>
            </div>
            @endforeach
        </div>
    </div>
    @endif
</div>
@endsection
