<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mosque_profiles', function (Blueprint $table) {
            $table->integer('hijri_correction')->default(0)->after('timezone');
        });
    }

    public function down(): void
    {
        Schema::table('mosque_profiles', function (Blueprint $table) {
            $table->dropColumn('hijri_correction');
        });
    }
};
