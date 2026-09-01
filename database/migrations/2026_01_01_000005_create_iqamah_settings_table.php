<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('iqamah_settings', function (Blueprint $table) {
            $table->id();
            $table->string('prayer_name');
            $table->boolean('is_enabled')->default(true);
            $table->integer('duration_minutes')->default(10);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('iqamah_settings');
    }
};
