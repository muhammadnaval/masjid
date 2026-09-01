<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('friday_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('is_enabled')->default(true);
            $table->boolean('disable_iqamah_on_friday')->default(true);
            $table->string('khutbah_title')->default("Khutbah & Shalat Jum'at");
            $table->string('khutbah_khatib')->default('Ustadz Dr. H. Ahmad Fauzi, M.A.');
            $table->string('khutbah_imam')->default('Ustadz Muhammad Ridwan');
            $table->integer('khutbah_duration_minutes')->default(35);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('friday_settings');
    }
};
