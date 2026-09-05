<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MosqueProfile;
use App\Models\PrayerLocation;
use App\Models\PrayerSchedule;
use App\Models\PrayerTimeCorrection;
use App\Models\IqamahSetting;
use App\Models\SyuruqSetting;
use App\Models\AudioSetting;
use App\Models\DonationSetting;
use App\Models\ThemeSetting;
use App\Models\CountdownSetting;
use App\Models\FridaySetting;
use App\Models\RunningText;
use App\Models\Agenda;
use App\Models\MediaItem;
use App\Models\SyncLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AdminPanelController extends Controller
{
    private const PAGES = ['profile','schedule','iqamah','syuruq','audio','media','donation','running-text','agenda','theme','hijri','countdown','friday','account'];

    public function page(string $page)
    {
        $data = match ($page) {
            'profile' => ['profile' => MosqueProfile::firstOrCreate(['id' => 1], ['name' => 'MASJID AL-HIDAYAH SITEBA', 'address' => 'Jl. Raya Siteba No. 15', 'timezone' => 'Asia/Jakarta'])],
            'schedule' => ['locations' => PrayerLocation::all(), 'activeLocation' => PrayerLocation::where('is_active', true)->first(), 'schedule' => PrayerSchedule::where('date', date('Y-m-d'))->first(), 'corrections' => PrayerTimeCorrection::all()->pluck('correction_minutes', 'prayer_name'), 'lastSync' => SyncLog::where('type', 'schedule_sync')->latest()->first(), 'provinces' => app(\App\Services\PrayerScheduleService::class)->getProvinces()],
            'iqamah' => ['settings' => IqamahSetting::all()->keyBy('prayer_name')],
            'syuruq' => ['setting' => SyuruqSetting::first()],
            'audio' => ['rows' => AudioSetting::all()->keyBy('type')],
            'donation' => ['donation' => DonationSetting::firstOrCreate(['id' => 1], ['title' => 'Infaq & Sedekah', 'is_active' => true])],
            'running-text' => ['items' => RunningText::orderByDesc('id')->get()],
            'agenda' => ['items' => Agenda::orderBy('date')->get()],
            'theme' => ['theme' => ThemeSetting::where('is_active', true)->firstOrCreate([], ['theme_name' => 'Deep Emerald', 'primary_color' => '#10b981', 'secondary_color' => '#f59e0b', 'background_color' => '#020617', 'text_color' => '#f8fafc', 'is_active' => true])],
            'hijri' => ['profile' => MosqueProfile::firstOrCreate(['id' => 1], ['name' => 'Masjid', 'timezone' => 'Asia/Jakarta'])],
            'countdown' => ['settings' => CountdownSetting::all()->keyBy('prayer_name')],
            'friday' => ['setting' => FridaySetting::firstOrCreate(['id' => 1], ['is_enabled' => true, 'disable_iqamah_on_friday' => true, 'khutbah_title' => "Khutbah & Shalat Jum'at", 'khutbah_duration_minutes' => 35])],
            'account' => ['user' => auth()->user()],
            'media' => ['items' => MediaItem::orderBy('sort_order')->get()],
            default => [],
        };
        return view('admin.page', ['page' => $page] + $data);
    }

    public function save(Request $request, string $page)
    {
        match ($page) {
            'profile' => $this->saveProfile($request),
            'schedule' => $this->saveSchedule($request),
            'iqamah' => $this->saveIqamah($request),
            'syuruq' => $this->saveSyuruq($request),
            'audio' => $this->saveAudio($request),
            'donation' => $this->saveDonation($request),
            'friday' => $this->saveFriday($request),
            'theme' => $this->saveTheme($request),
            'hijri' => $this->saveHijri($request),
            'countdown' => $this->saveCountdown($request),
            'account' => $this->saveAccount($request),
            default => null,
        };
        return redirect()->route('admin.page.edit', $page)->with('success', 'Perubahan berhasil disimpan.');
    }

    public function storeRunningText(Request $request)
    {
        $validated = $request->validate(['text' => 'required|string|max:1000', 'speed' => 'nullable|string|in:slow,normal,fast', 'category' => 'nullable|string|in:umum,donasi,kajian,himbauan']);
        $validated['speed'] ??= 'normal';
        $validated['category'] ??= 'umum';
        $validated['is_active'] = true;
        RunningText::create($validated);
        return redirect()->route('admin.page.edit', 'running-text')->with('success', 'Running text berhasil ditambahkan.');
    }

    public function storeAgenda(Request $request)
    {
        $validated = $request->validate(['title' => 'required|string|max:255', 'date' => 'required|date', 'time' => 'nullable|string|max:50', 'location' => 'nullable|string|max:255', 'description' => 'nullable|string', 'duration_seconds' => 'required|integer|min:3|max:300', 'is_islamic_holiday' => 'nullable|boolean']);
        $validated['time'] ??= '18:30';
        $validated['duration_seconds'] ??= 8;
        $validated['is_islamic_holiday'] = $validated['is_islamic_holiday'] ?? false;
        $validated['is_active'] = true;
        Agenda::create($validated);
        return redirect()->route('admin.page.edit', 'agenda')->with('success', 'Agenda berhasil ditambahkan.');
    }

    public function storeMedia(Request $request)
    {
        $validated = $request->validate(['title' => 'required|string|max:255', 'type' => 'required|string|in:image,video,youtube,livestream,text,table,donation,hadith,doa', 'content' => 'nullable|string', 'file_path' => 'nullable|string|max:500', 'duration_seconds' => 'required|integer|min:3|max:300']);
        $validated['sort_order'] = (MediaItem::max('sort_order') ?? 0) + 1;
        $validated['is_active'] = true;
        MediaItem::create($validated);
        return redirect()->route('admin.page.edit', 'media')->with('success', 'Media berhasil ditambahkan.');
    }

    public function toggle(string $page, int $id)
    {
        $model = match ($page) { 'running-text' => RunningText::class, 'agenda' => Agenda::class, 'media' => MediaItem::class, default => abort(404) };
        $item = $model::findOrFail($id);
        $item->update(['is_active' => !$item->is_active]);
        return back()->with('success', 'Status berhasil diubah.');
    }

    public function delete(string $page, int $id)
    {
        $model = match ($page) { 'running-text' => RunningText::class, 'agenda' => Agenda::class, 'media' => MediaItem::class, default => abort(404) };
        $model::findOrFail($id)->delete();
        return back()->with('success', 'Data berhasil dihapus.');
    }

    private function saveProfile(Request $r): void {
        $data = $r->validate(['name'=>'required|string|max:255','address'=>'required|string','contact'=>'nullable|string|max:255','timezone'=>'required|string|max:50']);
        if ($r->hasFile('logo_image')) {
            $r->validate(['logo_image'=>'image|mimes:png,jpg,jpeg,webp|max:4096']);
            $profile = MosqueProfile::find(1);
            $previous = $profile?->logo_path;
            if ($previous && !str_starts_with($previous, 'http')) {
                $previousPath = ltrim(str_replace('/storage/', '', $previous), '/');
                Storage::disk('public')->delete($previousPath);
            }
            $data['logo_path'] = $r->file('logo_image')->store('profil', 'public');
        }
        MosqueProfile::updateOrCreate(['id'=>1], $data);
    }
    private function saveSchedule(Request $r): void { $v=$r->validate(['corrections'=>'required|array','corrections.*'=>'integer|min:-60|max:60']); foreach($v['corrections'] as $p=>$m) PrayerTimeCorrection::updateOrCreate(['prayer_name'=>$p],['correction_minutes'=>$m]); }
    private function saveIqamah(Request $r): void { foreach(['subuh','dzuhur','ashar','maghrib','isya'] as $p) IqamahSetting::updateOrCreate(['prayer_name'=>$p],['is_enabled'=>$r->boolean("{$p}_enabled"),'duration_minutes'=>(int)$r->input("{$p}_minutes",7)]); }
    private function saveSyuruq(Request $r): void { SyuruqSetting::updateOrCreate(['id'=>1],$r->validate(['is_enabled'=>'required|boolean','duration_minutes'=>'required|integer|min:1|max:60'])); }
    private function saveAudio(Request $r): void {
        $v=$r->validate(['volume_adzan'=>'required|integer|min:0|max:100','adzan_duration_seconds'=>'required|integer|min:30|max:600','murottal_before_minutes'=>'required|integer|min:1|max:60','volume_murottal'=>'required|integer|min:0|max:100','dzikir_pagi_after_minutes'=>'nullable|integer|min:1|max:120','dzikir_petang_after_minutes'=>'nullable|integer|min:1|max:120','volume_dzikir'=>'required|integer|min:0|max:100']);
        AudioSetting::updateOrCreate(['type'=>'adzan'],['prayer_name'=>'all','play_after_minutes'=>$v['adzan_duration_seconds'],'volume'=>$v['volume_adzan'],'is_enabled'=>true]);
        AudioSetting::updateOrCreate(['type'=>'murottal'],['prayer_name'=>'all','play_before_minutes'=>$v['murottal_before_minutes'],'volume'=>$v['volume_murottal'],'is_enabled'=>$r->boolean('murottal_enabled')]);
        AudioSetting::updateOrCreate(['type'=>'dzikir_pagi'],['prayer_name'=>'subuh','play_after_minutes'=>$v['dzikir_pagi_after_minutes']??10,'volume'=>$v['volume_dzikir'],'is_enabled'=>true]);
        AudioSetting::updateOrCreate(['type'=>'dzikir_petang'],['prayer_name'=>'ashar','play_after_minutes'=>$v['dzikir_petang_after_minutes']??10,'volume'=>$v['volume_dzikir'],'is_enabled'=>true]);
    }
    private function saveDonation(Request $r): void {
        $data = $r->validate(['title'=>'required|string|max:255','description'=>'nullable|string','bank_name'=>'nullable|string','account_name'=>'nullable|string','account_number'=>'nullable|string','duration_seconds'=>'required|integer|min:3|max:300','is_active'=>'required|boolean']);
        if ($r->hasFile('qr_image')) {
            $r->validate(['qr_image'=>'image|mimes:png,jpg,jpeg,webp|max:4096']);
            // Delete previous uploaded QR (only files we manage on the public disk)
            $previous = DonationSetting::find(1)?->qr_code_path;
            if ($previous && !str_starts_with($previous, 'http')) {
                Storage::disk('public')->delete($previous);
            }
            $data['qr_code_path'] = $r->file('qr_image')->store('donasi', 'public');
        }
        DonationSetting::updateOrCreate(['id'=>1],$data);
    }
    private function saveFriday(Request $r): void { FridaySetting::updateOrCreate(['id'=>1],$r->validate(['is_enabled'=>'required|boolean','disable_iqamah_on_friday'=>'required|boolean','khutbah_title'=>'required|string|max:255','khutbah_khatib'=>'nullable|string|max:255','khutbah_imam'=>'nullable|string|max:255','khutbah_duration_minutes'=>'required|integer|min:5|max:120'])); }
    private function saveTheme(Request $r): void { ThemeSetting::where('is_active',true)->update($r->validate(['theme_name'=>'required|string|max:255','primary_color'=>'required|string','secondary_color'=>'required|string','background_color'=>'required|string','text_color'=>'required|string'])); }
    private function saveHijri(Request $r): void { MosqueProfile::updateOrCreate(['id'=>1],$r->validate(['hijri_correction'=>'required|integer|min:-5|max:5'])); }
    private function saveCountdown(Request $r): void { foreach(['subuh','dzuhur','ashar','maghrib','isya'] as $p) CountdownSetting::updateOrCreate(['prayer_name'=>$p],['minutes'=>(int)$r->input("{$p}_minutes",5)]); }
    private function saveAccount(Request $r): void {
        $user=auth()->user();
        if($r->has('name')) $user->update($r->validate(['name'=>'required|string|max:255','email'=>'required|email']));
        if($r->filled('new_password')){ $v=$r->validate(['current_password'=>'required','new_password'=>'required|min:6|confirmed']); if(!Hash::check($v['current_password'],$user->password)) abort(422,'Password lama tidak benar.'); $user->update(['password'=>Hash::make($v['new_password'])]); }
    }
}
