<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('theme_settings', function (Blueprint $table) {
            $table->id();
            $table->string('theme_name');
            $table->string('primary_color')->default('emerald');
            $table->string('secondary_color')->default('amber');
            $table->string('background_color')->default('bg-slate-950');
            $table->string('text_color')->default('text-slate-100');
            $table->json('layout_config')->nullable();
            $table->longText('custom_css')->nullable();
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('theme_settings');
    }
};
