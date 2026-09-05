<?php

namespace App\Http\Controllers;

use App\Models\DonationSetting;
use Illuminate\View\View;

class DonationController extends Controller
{
    public function show(): View
    {
        $donation = DonationSetting::where('is_active', true)->first();

        abort_if(!$donation, 404);

        return view('donation', compact('donation'));
    }
}
