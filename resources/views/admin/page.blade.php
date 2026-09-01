@extends('layouts.admin')
@section('title', ucfirst(str_replace('-', ' ', $page)))
@section('header', match($page) {
    'profile' => 'Profil Masjid',
    'schedule' => 'Jadwal & Lokasi Sholat',
    'iqamah' => 'Pengaturan Iqamah',
    'syuruq' => 'Pengaturan Syuruq',
    'audio' => 'Pengaturan Audio',
    'donation' => 'QR Donasi',
    'running-text' => 'Running Text',
    'agenda' => 'Agenda & Hari Besar',
    'theme' => 'Tema & Desain',
    'hijri' => 'Koreksi Tanggal Hijriyah',
    'countdown' => 'Pengaturan Countdown',
    'friday' => "Pengaturan Mode Jum'at",
    'account' => 'Pengaturan Akun',
    'media' => 'Slide & Media',
    default => ucfirst($page),
})

@php
    $roles = ['subuh','dzuhur','ashar','maghrib','isya'];
    $prayerIcons = ['subuh'=>'🌙','dzuhur'=>'☀️','ashar'=>'🌤️','maghrib'=>'🌅','isya'=>'⭐'];
@endphp

@section('content')
@if($page === 'profile')
<div class="max-w-4xl space-y-6">
    <form method="POST" action="{{ route('admin.page.save', 'profile') }}" class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        @csrf
        <h3 class="text-sm font-bold text-emerald-400">Identitas Masjid</h3>
        <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Nama Masjid</label><input type="text" name="name" value="{{ old('name', $profile->name ?? '') }}" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500 transition"></div>
        <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Alamat</label><textarea name="address" rows="2" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500 transition">{{ old('address', $profile->address ?? '') }}</textarea></div>
        <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Kontak</label><input type="text" name="contact" value="{{ old('contact', $profile->contact ?? '') }}" class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
            <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Timezone</label><select name="timezone" class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"><option value="Asia/Jakarta" {{ ($profile->timezone ?? '') === 'Asia/Jakarta' ? 'selected' : '' }}>WIB</option><option value="Asia/Makassar" {{ ($profile->timezone ?? '') === 'Asia/Makassar' ? 'selected' : '' }}>WITA</option><option value="Asia/Jayapura" {{ ($profile->timezone ?? '') === 'Asia/Jayapura' ? 'selected' : '' }}>WIT</option></select></div>
        </div>
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan Perubahan</button>
    </form>
</div>

@elseif($page === 'syuruq')
<div class="max-w-4xl">
    <form method="POST" action="{{ route('admin.page.save', 'syuruq') }}" class="space-y-4">
        @csrf
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-emerald-400">Overlay Syuruq</h3>
            <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_enabled" value="1" {{ ($setting->is_enabled ?? true) ? 'checked' : '' }} class="w-5 h-5 rounded bg-slate-800 border-slate-700 text-emerald-500">
                <span class="text-sm text-white">Aktifkan overlay syuruq</span>
            </label>
            <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Durasi (menit)</label><input type="number" name="duration_minutes" min="1" max="60" value="{{ $setting->duration_minutes ?? 10 }}" class="w-32 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center"></div>
        </div>
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan</button>
    </form>
</div>

@elseif($page === 'iqamah')
<div class="max-w-4xl">
    <form method="POST" action="{{ route('admin.page.save', 'iqamah') }}" class="space-y-4">
        @csrf
        @foreach($roles as $prayer)
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div class="flex items-center gap-3">
                <span class="text-lg">{{ $prayerIcons[$prayer] }}</span>
                <div>
                    <span class="text-sm font-bold text-white">{{ ucfirst($prayer) }}</span>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs text-slate-400">Menit:</span>
                        <input type="number" name="{{ $prayer }}_minutes" min="1" max="60" value="{{ $settings[$prayer]->duration_minutes ?? 7 }}" class="w-16 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white text-center">
                    </div>
                </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="{{ $prayer }}_enabled" value="1" {{ ($settings[$prayer]->is_enabled ?? true) ? 'checked' : '' }} class="sr-only peer">
                <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
        </div>
        @endforeach
        <button type="submit" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan Iqamah</button>
    </form>
</div>

@elseif($page === 'countdown')
<div class="max-w-2xl">
    <form method="POST" action="{{ route('admin.page.save', 'countdown') }}" class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        @csrf
        <p class="text-xs text-slate-400">Menit countdown yang ditampilkan sebelum waktu adzan.</p>
        @foreach($roles as $prayer)
        <div class="flex items-center gap-4">
            <span class="text-sm font-bold text-white w-20">{{ ucfirst($prayer) }}</span>
            <input type="number" name="{{ $prayer }}_minutes" min="1" max="30" value="{{ $settings[$prayer]->minutes ?? 5 }}" class="w-24 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center">
            <span class="text-xs text-slate-500">menit</span>
        </div>
        @endforeach
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan</button>
    </form>
</div>

@elseif($page === 'hijri')
<div class="max-w-2xl">
    <form method="POST" action="{{ route('admin.page.save', 'hijri') }}" class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        @csrf
        <p class="text-xs text-slate-400">Koreksi tanggal Hijriyah jika ada selisih ±1-5 hari.</p>
        <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Koreksi (hari, -5 s/d +5)</label><input type="number" name="hijri_correction" min="-5" max="5" value="{{ $profile->hijri_correction ?? 0 }}" class="w-32 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center"></div>
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan</button>
    </form>
</div>

@elseif($page === 'theme')
<div class="max-w-4xl">
    <form method="POST" action="{{ route('admin.page.save', 'theme') }}" class="space-y-6">
        @csrf
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-emerald-400">Kustomisasi Tema</h3>
            <div><label class="block text-xs font-semibold text-slate-300 mb-1">Nama Tema</label><input type="text" name="theme_name" value="{{ $theme->theme_name ?? 'Deep Emerald' }}" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
            <div class="grid grid-cols-4 gap-4">
                @foreach(['primary_color'=>'Primer','secondary_color'=>'Sekunder','background_color'=>'Latar','text_color'=>'Teks'] as $field => $label)
                <div>
                    <label class="block text-xs text-slate-300 mb-1">{{ $label }}</label>
                    <input type="color" name="{{ $field }}" value="{{ $theme->$field ?? '#ffffff' }}" class="w-full h-10 rounded cursor-pointer">
                </div>
                @endforeach
            </div>
        </div>
        <div class="flex gap-3">
            <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan Tema</button>
        </div>
    </form>
</div>

@elseif($page === 'donation')
<div class="max-w-2xl">
    <form method="POST" action="{{ route('admin.page.save', 'donation') }}" class="space-y-6">
        @csrf
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-emerald-400">QR Donasi</h3>
            <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-white">Aktifkan Donasi</span>
                <input type="checkbox" name="is_active" value="1" {{ ($donation->is_active ?? true) ? 'checked' : '' }} class="w-5 h-5 rounded bg-slate-800 border-slate-700 text-emerald-500">
            </div>
            <div><label class="block text-xs font-semibold text-slate-300 mb-1">Judul</label><input type="text" name="title" value="{{ $donation->title ?? '' }}" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
            <div><label class="block text-xs font-semibold text-slate-300 mb-1">Deskripsi</label><textarea name="description" rows="2" class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">{{ $donation->description ?? '' }}</textarea></div>
            <div class="grid grid-cols-3 gap-4">
                <div><label class="block text-xs text-slate-300 mb-1">Bank</label><input type="text" name="bank_name" value="{{ $donation->bank_name ?? '' }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
                <div><label class="block text-xs text-slate-300 mb-1">Nama Rekening</label><input type="text" name="account_name" value="{{ $donation->account_name ?? '' }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
                <div><label class="block text-xs text-slate-300 mb-1">Nomor</label><input type="text" name="account_number" value="{{ $donation->account_number ?? '' }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
            </div>
        </div>
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan</button>
    </form>
</div>

@elseif($page === 'friday')
<div class="max-w-4xl">
    <form method="POST" action="{{ route('admin.page.save', 'friday') }}" class="space-y-6">
        @csrf
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-emerald-400">Mode Jum'at</h3>
            <div class="flex items-center justify-between">
                <span class="text-sm text-white">Aktifkan Mode Jum'at</span>
                <input type="checkbox" name="is_enabled" value="1" {{ ($setting->is_enabled ?? true) ? 'checked' : '' }} class="w-5 h-5 rounded bg-slate-800 border-slate-700 text-emerald-500">
            </div>
            <div class="flex items-center justify-between">
                <span class="text-sm text-white">Nonaktifkan Iqamah Dzuhur</span>
                <input type="checkbox" name="disable_iqamah_on_friday" value="1" {{ ($setting->disable_iqamah_on_friday ?? true) ? 'checked' : '' }} class="w-5 h-5 rounded bg-slate-800 border-slate-700 text-emerald-500">
            </div>
            <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Judul Khutbah</label><input type="text" name="khutbah_title" value="{{ $setting->khutbah_title ?? '' }}" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-xs text-slate-300 mb-1">Khatib</label><input type="text" name="khutbah_khatib" value="{{ $setting->khutbah_khatib ?? '' }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
                <div><label class="block text-xs text-slate-300 mb-1">Imam</label><input type="text" name="khutbah_imam" value="{{ $setting->khutbah_imam ?? '' }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
            </div>
            <div><label class="block text-xs text-slate-300 mb-1">Durasi Khutbah (menit)</label><input type="number" name="khutbah_duration_minutes" min="5" max="120" value="{{ $setting->khutbah_duration_minutes ?? 35 }}" class="w-32 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center"></div>
        </div>
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan</button>
    </form>
</div>

@elseif($page === 'account')
<div class="max-w-2xl space-y-6">
    <form method="POST" action="{{ route('admin.page.save', 'account') }}" class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        @csrf
        <h3 class="text-sm font-bold text-emerald-400">Profil Akun</h3>
        <div><label class="block text-xs text-slate-300 mb-1">Nama</label><input type="text" name="name" value="{{ $user->name ?? '' }}" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
        <div><label class="block text-xs text-slate-300 mb-1">Email</label><input type="email" name="email" value="{{ $user->email ?? '' }}" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan Profil</button>
    </form>
    <form method="POST" action="{{ route('admin.page.save', 'account') }}" class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        @csrf
        <h3 class="text-sm font-bold text-emerald-400">Ubah Password</h3>
        @if($errors->has('current_password'))<div class="p-2 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl">{{ $errors->first('current_password') }}</div>@endif
        <div><label class="block text-xs text-slate-300 mb-1">Password Lama</label><input type="password" name="current_password" class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
        <div><label class="block text-xs text-slate-300 mb-1">Password Baru</label><input type="password" name="new_password" class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
        <div><label class="block text-xs text-slate-300 mb-1">Konfirmasi Password Baru</label><input type="password" name="new_password_confirmation" class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Ubah Password</button>
    </form>
</div>

@elseif($page === 'running-text')
<div class="max-w-4xl space-y-6">
    <form method="POST" action="{{ route('admin.running-text.store') }}" class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        @csrf
        <h3 class="text-sm font-bold text-emerald-400">Tambah Running Text</h3>
        <textarea name="text" rows="2" required placeholder="Isi running text..." class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></textarea>
        <div class="flex gap-4 items-end">
            <div><label class="block text-xs text-slate-300 mb-1">Kategori</label><select name="category" class="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"><option value="umum">Umum</option><option value="donasi">Donasi</option><option value="kajian">Kajian</option><option value="himbauan">Himbauan</option></select></div>
            <div><label class="block text-xs text-slate-300 mb-1">Kecepatan</label><select name="speed" class="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"><option value="slow">Lambat</option><option value="normal" selected>Normal</option><option value="fast">Cepat</option></select></div>
            <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition">Tambah</button>
        </div>
    </form>
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
        @forelse($items as $item)
        <div class="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div class="flex items-center gap-3">
                <span class="text-[10px] px-2 py-0.5 rounded-full {{ $item->is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400' }}">{{ $item->is_active ? 'Aktif' : 'Off' }}</span>
                <span class="text-xs text-white">{{ Str::limit($item->text, 60) }}</span>
            </div>
            <div class="flex gap-2">
                <form method="POST" action="{{ route('admin.page.toggle', ['running-text', $item->id]) }}"><input type="hidden" name="_method" value="PUT">@csrf<button class="text-[10px] px-2 py-1 {{ $item->is_active ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400' }} rounded-lg">{{ $item->is_active ? 'Matikan' : 'Aktifkan' }}</button></form>
                <form method="POST" action="{{ route('admin.page.delete', ['running-text', $item->id]) }}" onsubmit="return confirm('Hapus?')"><input type="hidden" name="_method" value="DELETE">@csrf<button class="text-[10px] px-2 py-1 bg-red-500/20 text-red-400 rounded-lg">Hapus</button></form>
            </div>
        </div>
        @empty
        <p class="text-slate-500 text-sm">Belum ada running text.</p>
        @endforelse
    </div>
</div>

@elseif($page === 'agenda')
<div class="max-w-4xl space-y-6">
    <form method="POST" action="{{ route('admin.agenda.store') }}" class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        @csrf
        <h3 class="text-sm font-bold text-emerald-400">Tambah Agenda</h3>
        <div class="grid grid-cols-3 gap-4">
            <div><label class="block text-xs text-slate-300 mb-1">Judul</label><input type="text" name="title" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
            <div><label class="block text-xs text-slate-300 mb-1">Tanggal</label><input type="date" name="date" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
            <div><label class="block text-xs text-slate-300 mb-1">Waktu</label><input type="time" name="time" value="18:30" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
        </div>
        <div><label class="block text-xs text-slate-300 mb-1">Deskripsi</label><textarea name="description" rows="2" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></textarea></div>
        <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" name="is_islamic_holiday" value="1"> Hari Besar Islam</label>
            <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition">Tambah</button>
        </div>
    </form>
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
        @forelse($items as $item)
        <div class="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div>
                <span class="text-xs font-bold text-white">{{ $item->title }}</span>
                <span class="text-[10px] text-slate-500 ml-2">{{ $item->date }} {{ $item->time ?? '' }}</span>
            </div>
            <div class="flex gap-2">
                <form method="POST" action="{{ route('admin.page.toggle', ['agenda', $item->id]) }}"><input type="hidden" name="_method" value="PUT">@csrf<button class="text-[10px] px-2 py-1 {{ $item->is_active ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400' }} rounded-lg">{{ $item->is_active ? 'Matikan' : 'Aktifkan' }}</button></form>
                <form method="POST" action="{{ route('admin.page.delete', ['agenda', $item->id]) }}" onsubmit="return confirm('Hapus?')"><input type="hidden" name="_method" value="DELETE">@csrf<button class="text-[10px] px-2 py-1 bg-red-500/20 text-red-400 rounded-lg">Hapus</button></form>
            </div>
        </div>
        @empty
        <p class="text-slate-500 text-sm">Belum ada agenda.</p>
        @endforelse
    </div>
</div>

@elseif($page === 'media')
<div class="max-w-4xl space-y-6">
    <form method="POST" action="{{ route('admin.media.store') }}" class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        @csrf
        <h3 class="text-sm font-bold text-emerald-400">Tambah Media Baru</h3>
        <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-xs text-slate-300 mb-1">Judul</label><input type="text" name="title" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
            <div><label class="block text-xs text-slate-300 mb-1">Tipe</label><select name="type" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"><option value="image">Gambar</option><option value="video">Video</option><option value="youtube">YouTube</option><option value="text">Teks</option><option value="hadith">Hadis</option><option value="doa">Doa</option></select></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-xs text-slate-300 mb-1">URL / File Path</label><input type="text" name="file_path" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
            <div><label class="block text-xs text-slate-300 mb-1">Durasi (detik)</label><input type="number" name="duration_seconds" min="3" max="300" value="10" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
        </div>
        <div><label class="block text-xs text-slate-300 mb-1">Konten</label><textarea name="content" rows="3" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"></textarea></div>
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Tambah Media</button>
    </form>
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
        @forelse($items as $item)
        <div class="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div class="flex items-center gap-3">
                <span class="text-[10px] px-2 py-0.5 rounded-full {{ $item->is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400' }}">{{ $item->is_active ? 'Aktif' : 'Off' }}</span>
                <span class="text-xs font-bold text-white">{{ $item->title }}</span>
                <span class="text-[10px] text-slate-500">{{ $item->type }}</span>
            </div>
            <div class="flex gap-2">
                <form method="POST" action="{{ route('admin.page.toggle', ['media', $item->id]) }}"><input type="hidden" name="_method" value="PUT">@csrf<button class="text-[10px] px-2 py-1 {{ $item->is_active ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400' }} rounded-lg">{{ $item->is_active ? 'Matikan' : 'Aktifkan' }}</button></form>
                <form method="POST" action="{{ route('admin.page.delete', ['media', $item->id]) }}" onsubmit="return confirm('Hapus?')"><input type="hidden" name="_method" value="DELETE">@csrf<button class="text-[10px] px-2 py-1 bg-red-500/20 text-red-400 rounded-lg">Hapus</button></form>
            </div>
        </div>
        @empty
        <p class="text-slate-500 text-sm">Belum ada media.</p>
        @endforelse
    </div>
</div>

@elseif($page === 'schedule')
<div class="max-w-4xl space-y-6">
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        <h3 class="text-sm font-bold text-emerald-400">Lokasi Aktif</h3>
        <div class="flex items-center gap-4 text-sm">
            <span class="text-slate-400">Provinsi: <strong class="text-white">{{ $activeLocation->province_name ?? '-' }}</strong></span>
            <span class="text-slate-400">Kota: <strong class="text-white">{{ $activeLocation->city_name ?? '-' }}</strong></span>
        </div>
        @if($schedule)
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            @foreach(['subuh','dzuhur','ashar','maghrib','isya'] as $prayer)
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800"><span class="text-xs text-slate-400 block">{{ ucfirst($prayer) }}</span><span class="text-lg font-bold text-emerald-300 block">{{ substr($schedule->$prayer ?? '--', 0, 5) }}</span></div>
            @endforeach
        </div>
        @else
        <p class="text-slate-500 text-sm">Belum ada jadwal.</p>
        @endif
    </div>

    {{-- Sync Button --}}
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl" x-data="{ syncing: false }">
        <div class="flex items-center justify-between">
            <div>
                <h3 class="text-sm font-bold text-emerald-400">Sinkronisasi Jadwal</h3>
                <p class="text-xs text-slate-400 mt-1">Ambil jadwal terbaru dari Kemenag RI ({{ $activeLocation->city_name ?? '-' }})</p>
                @if($lastSync)
                <p class="text-xs text-slate-500 mt-1">Terakhir: {{ \Carbon\Carbon::parse($lastSync->created_at)->locale('id')->diffForHumans() }} — <span class="{{ $lastSync->status === 'success' ? 'text-emerald-400' : 'text-red-400' }}">{{ $lastSync->status === 'success' ? 'Berhasil' : 'Gagal' }}</span></p>
                @endif
            </div>
            <form method="POST" action="{{ route('admin.schedule.sync') }}" x-on:submit="syncing = true">
                @csrf
                <button type="submit" class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition disabled:opacity-50" :disabled="syncing">
                    <span x-show="!syncing">🔄 Sinkronisasi</span>
                    <span x-show="syncing" x-cloak><svg class="animate-spin h-4 w-4 inline" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Menyinkronkan...</span>
                </button>
            </form>
        </div>
    </div>

    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <h3 class="text-sm font-bold text-emerald-400 mb-4">Koreksi Waktu (menit)</h3>
        <form method="POST" action="{{ route('admin.page.save', 'schedule') }}" class="space-y-4">
            @csrf
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                @foreach($roles as $prayer)
                <div><label class="block text-xs text-slate-300 mb-1">{{ ucfirst($prayer) }}</label><input type="number" name="corrections[{{ $prayer }}]" min="-60" max="60" value="{{ $corrections[$prayer] ?? 0 }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center"></div>
                @endforeach
            </div>
            <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan Koreksi</button>
        </form>
    </div>
</div>

@elseif($page === 'audio')
<div class="max-w-4xl space-y-6">
    <form method="POST" action="{{ route('admin.page.save', 'audio') }}" class="space-y-6">
        @csrf
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-emerald-400">Audio Adzan</h3>
            <div><label class="block text-xs text-slate-300 mb-1">Volume</label><input type="range" name="volume_adzan" min="0" max="100" value="{{ $rows->get('adzan')->volume ?? 80 }}" class="w-full"></div>
            <div><label class="block text-xs text-slate-300 mb-1">Durasi Overlay (detik)</label><input type="number" name="adzan_duration_seconds" min="30" max="600" value="{{ $rows->get('adzan')->play_after_minutes ?? 180 }}" class="w-40 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center"></div>
            @if($rows->get('adzan')?->file_path)<p class="text-xs text-emerald-400">File: {{ basename($rows->get('adzan')->file_path) }}</p>@endif
        </div>
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-emerald-400">Audio Murottal</h3>
            <label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="murottal_enabled" value="1" {{ ($rows->get('murottal')->is_enabled ?? true) ? 'checked' : '' }} class="w-5 h-5 rounded bg-slate-800 border-slate-700 text-emerald-500"><span class="text-sm text-white">Aktifkan</span></label>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-xs text-slate-300 mb-1">Putar X menit sebelum adzan</label><input type="number" name="murottal_before_minutes" min="1" max="60" value="{{ $rows->get('murottal')->play_before_minutes ?? 5 }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center"></div>
                <div><label class="block text-xs text-slate-300 mb-1">Volume</label><input type="range" name="volume_murottal" min="0" max="100" value="{{ $rows->get('murottal')->volume ?? 80 }}" class="w-full"></div>
            </div>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-emerald-400">Dzikir Pagi & Petang</h3>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-xs text-slate-300 mb-1">Dzikir Pagi: menit setelah subuh</label><input type="number" name="dzikir_pagi_after_minutes" min="1" max="120" value="{{ $rows->get('dzikir_pagi')->play_after_minutes ?? 10 }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center"></div>
                <div><label class="block text-xs text-slate-300 mb-1">Dzikir Petang: menit setelah ashar</label><input type="number" name="dzikir_petang_after_minutes" min="1" max="120" value="{{ $rows->get('dzikir_petang')->play_after_minutes ?? 10 }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center"></div>
            </div>
            <div><label class="block text-xs text-slate-300 mb-1">Volume Dzikir</label><input type="range" name="volume_dzikir" min="0" max="100" value="{{ $rows->get('dzikir_pagi')->volume ?? 80 }}" class="w-full"></div>
        </div>
        <button type="submit" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan Pengaturan Audio</button>
    </form>
</div>

@else
<div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl"><p class="text-slate-400 text-sm">Halaman <strong>{{ $page }}</strong> sedang dalam pengembangan.</p></div>
@endif
@endsection
