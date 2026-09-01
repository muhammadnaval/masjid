<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audio_settings', function (Blueprint $table) {
            $table->id();
            $table->string('type')->default('adzan');
            $table->string('prayer_name')->nullable();
            $table->string('file_path')->nullable();
            $table->string('source_url')->nullable();
            $table->integer('play_before_minutes')->nullable();
            $table->integer('play_after_minutes')->nullable();
            $table->integer('volume')->default(80);
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audio_settings');
    }
};
