<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donation_settings', function (Blueprint $table) {
            $table->unsignedInteger('duration_seconds')->default(10);
        });
        Schema::table('agendas', function (Blueprint $table) {
            $table->unsignedInteger('duration_seconds')->default(8);
        });
    }

    public function down(): void
    {
        Schema::table('donation_settings', function (Blueprint $table) {
            $table->dropColumn('duration_seconds');
        });
        Schema::table('agendas', function (Blueprint $table) {
            $table->dropColumn('duration_seconds');
        });
    }
};
