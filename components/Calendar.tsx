import React, { useState, useMemo } from 'react';
import { Card, Radio, Button, Tag, Tooltip, Typography, Empty, Badge } from 'antd';
import { LeftOutlined, RightOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTime } from '../context/TimeContext';
import { formatDuration } from '../utils';

const { Title, Text } = Typography;

type ViewMode = 'day' | 'week' | 'month';

// Helper functions
const startOfDay = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const startOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const startOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

const addDays = (date: Date, days: number): Date => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

const addMonths = (date: Date, months: number): Date => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
};

const isSameDay = (d1: Date, d2: Date): boolean => {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
};

const getDaysInMonth = (date: Date): Date[] => {
    const start = startOfMonth(date);
    const days: Date[] = [];
    const month = start.getMonth();

    // Add days from previous month to fill the first week
    const firstDayOfWeek = start.getDay() || 7; // Convert Sunday (0) to 7
    for (let i = firstDayOfWeek - 1; i > 0; i--) {
        days.push(addDays(start, -i));
    }

    // Add all days of current month
    let current = new Date(start);
    while (current.getMonth() === month) {
        days.push(new Date(current));
        current = addDays(current, 1);
    }

    // Add days from next month to complete the last week
    while (days.length % 7 !== 0) {
        days.push(new Date(current));
        current = addDays(current, 1);
    }

    return days;
};

export const Calendar: React.FC = () => {
    const { entries, projects, clients } = useTime();
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(new Date());

    const completedEntries = entries.filter(e => e.endTime !== null);

    const getProjectDetails = (projectId: string) => {
        const proj = projects.find(p => p.id === projectId);
        const client = clients.find(c => c.id === proj?.clientId);
        return { proj, client };
    };

    // Group entries by day
    const entriesByDay = useMemo(() => {
        const grouped: Record<string, typeof completedEntries> = {};
        completedEntries.forEach(entry => {
            const dayKey = startOfDay(new Date(entry.startTime)).toISOString();
            if (!grouped[dayKey]) grouped[dayKey] = [];
            grouped[dayKey].push(entry);
        });
        return grouped;
    }, [completedEntries]);

    // Get entries for a specific day
    const getEntriesForDay = (date: Date) => {
        const dayKey = startOfDay(date).toISOString();
        return entriesByDay[dayKey] || [];
    };

    // Calculate total duration for a day
    const getDayTotal = (date: Date): number => {
        const dayEntries = getEntriesForDay(date);
        return dayEntries.reduce((acc, entry) => {
            return acc + ((entry.endTime || 0) - entry.startTime);
        }, 0);
    };

    // Navigation handlers
    const navigatePrev = () => {
        switch (viewMode) {
            case 'day':
                setCurrentDate(addDays(currentDate, -1));
                break;
            case 'week':
                setCurrentDate(addDays(currentDate, -7));
                break;
            case 'month':
                setCurrentDate(addMonths(currentDate, -1));
                break;
        }
    };

    const navigateNext = () => {
        switch (viewMode) {
            case 'day':
                setCurrentDate(addDays(currentDate, 1));
                break;
            case 'week':
                setCurrentDate(addDays(currentDate, 7));
                break;
            case 'month':
                setCurrentDate(addMonths(currentDate, 1));
                break;
        }
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Get date range label
    const getDateRangeLabel = (): string => {
        const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        switch (viewMode) {
            case 'day':
                return currentDate.toLocaleDateString('es-ES', { weekday: 'long', ...opts });
            case 'week':
                const weekStart = startOfWeek(currentDate);
                const weekEnd = addDays(weekStart, 6);
                return `${weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('es-ES', opts)}`;
            case 'month':
                return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        }
    };

    // Render entry block
    const renderEntry = (entry: typeof completedEntries[0], compact: boolean = false) => {
        const { proj, client } = getProjectDetails(entry.projectId);
        const duration = (entry.endTime || 0) - entry.startTime;
        const startTime = new Date(entry.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        return (
            <Tooltip
                key={entry.id}
                title={
                    <div>
                        <div><strong>{client?.name}</strong> / {proj?.name}</div>
                        <div>{entry.description || 'Sin descripción'}</div>
                        <div>{startTime} • {formatDuration(duration)}</div>
                    </div>
                }
            >
                <div
                    className={`rounded px-2 py-1 mb-1 text-white text-xs truncate cursor-pointer hover:opacity-80 transition-opacity ${compact ? 'text-[10px] py-0.5' : ''}`}
                    style={{ backgroundColor: proj?.color || '#1677ff' }}
                >
                    {compact ? (
                        formatDuration(duration)
                    ) : (
                        <>
                            <span className="font-medium">{entry.description || proj?.name}</span>
                            <span className="opacity-75 ml-2">{formatDuration(duration)}</span>
                        </>
                    )}
                </div>
            </Tooltip>
        );
    };

    // Day View
    const renderDayView = () => {
        const dayEntries = getEntriesForDay(currentDate);
        const totalDuration = getDayTotal(currentDate);

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                        <Text className="text-gray-500">Total del día</Text>
                        <Title level={3} style={{ margin: 0 }}>{formatDuration(totalDuration)}</Title>
                    </div>
                    <Tag color="blue" className="text-lg px-4 py-1">{dayEntries.length} entradas</Tag>
                </div>

                {dayEntries.length === 0 ? (
                    <Empty description="No hay entradas para este día" />
                ) : (
                    <div className="space-y-2">
                        {dayEntries.map(entry => {
                            const { proj, client } = getProjectDetails(entry.projectId);
                            const duration = (entry.endTime || 0) - entry.startTime;
                            const startTime = new Date(entry.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                            const endTime = new Date(entry.endTime!).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                            return (
                                <div key={entry.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                                    <div
                                        className="w-1 h-12 rounded-full"
                                        style={{ backgroundColor: proj?.color || '#1677ff' }}
                                    />
                                    <div className="flex-1">
                                        <Text strong className="text-gray-700">{entry.description || 'Sin descripción'}</Text>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Tag>{client?.name}</Tag>
                                            <Text className="text-gray-400 text-sm">{proj?.name}</Text>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Text className="text-gray-500 text-sm">{startTime} - {endTime}</Text>
                                        <div>
                                            <Tag color="blue" className="font-mono">{formatDuration(duration)}</Tag>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    // Week View
    const renderWeekView = () => {
        const weekStart = startOfWeek(currentDate);
        const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
        const today = startOfDay(new Date());

        return (
            <div className="grid grid-cols-7 gap-3">
                {days.map(day => {
                    const dayEntries = getEntriesForDay(day);
                    const totalDuration = getDayTotal(day);
                    const isToday = isSameDay(day, today);

                    return (
                        <div
                            key={day.toISOString()}
                            className={`min-h-[350px] p-3 rounded-lg border-2 ${isToday ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white'}`}
                        >
                            <div className={`text-center pb-3 mb-3 border-b ${isToday ? 'border-blue-200' : 'border-gray-100'}`}>
                                <div className={`text-sm uppercase font-semibold ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                                </div>
                                <div className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                                    {day.getDate()}
                                </div>
                                {totalDuration > 0 && (
                                    <Tag color={isToday ? 'blue' : 'green'} className="mt-2">
                                        {formatDuration(totalDuration)}
                                    </Tag>
                                )}
                            </div>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                {dayEntries.map(entry => {
                                    const { proj, client } = getProjectDetails(entry.projectId);
                                    const duration = (entry.endTime || 0) - entry.startTime;
                                    const startTime = new Date(entry.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <Tooltip
                                            key={entry.id}
                                            title={
                                                <div>
                                                    <div><strong>{client?.name}</strong> / {proj?.name}</div>
                                                    <div>{entry.description || 'Sin descripción'}</div>
                                                    <div>{startTime} • {formatDuration(duration)}</div>
                                                </div>
                                            }
                                        >
                                            <div
                                                className="rounded-lg px-3 py-2 text-white text-sm cursor-pointer hover:opacity-90 transition-opacity"
                                                style={{ backgroundColor: proj?.color || '#1677ff' }}
                                            >
                                                <div className="font-medium truncate">{entry.description || proj?.name}</div>
                                                <div className="text-xs opacity-80 mt-1">{startTime} • {formatDuration(duration)}</div>
                                            </div>
                                        </Tooltip>
                                    );
                                })}
                                {dayEntries.length === 0 && (
                                    <div className="text-gray-400 text-sm text-center py-4">Sin entradas</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Month View
    const renderMonthView = () => {
        const days = getDaysInMonth(currentDate);
        const today = startOfDay(new Date());
        const currentMonth = currentDate.getMonth();

        return (
            <div>
                {/* Header with day names */}
                <div className="grid grid-cols-7 gap-2 mb-3">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                        <div key={day} className="text-center text-sm font-semibold text-gray-600 py-3 bg-gray-50 rounded">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                    {days.map(day => {
                        const dayEntries = getEntriesForDay(day);
                        const totalDuration = getDayTotal(day);
                        const isToday = isSameDay(day, today);
                        const isCurrentMonth = day.getMonth() === currentMonth;

                        return (
                            <div
                                key={day.toISOString()}
                                className={`min-h-[120px] p-3 rounded-lg border-2 transition-all
                                    ${isToday ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-100 bg-white'}
                                    ${!isCurrentMonth ? 'opacity-40 bg-gray-50' : ''}
                                    ${dayEntries.length > 0 ? 'hover:shadow-md cursor-pointer hover:border-gray-300' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                                        {day.getDate()}
                                    </div>
                                    {totalDuration > 0 && (
                                        <Tag color={isToday ? 'blue' : 'green'} className="text-xs">
                                            {formatDuration(totalDuration)}
                                        </Tag>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {dayEntries.slice(0, 3).map(entry => {
                                        const { proj } = getProjectDetails(entry.projectId);
                                        const duration = (entry.endTime || 0) - entry.startTime;
                                        return (
                                            <Tooltip key={entry.id} title={`${entry.description || proj?.name} - ${formatDuration(duration)}`}>
                                                <div
                                                    className="text-xs px-2 py-1 rounded truncate text-white"
                                                    style={{ backgroundColor: proj?.color || '#1677ff' }}
                                                >
                                                    {entry.description || proj?.name}
                                                </div>
                                            </Tooltip>
                                        );
                                    })}
                                    {dayEntries.length > 3 && (
                                        <div className="text-xs text-gray-400 text-center">
                                            +{dayEntries.length - 3} más
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Title level={2} style={{ margin: 0 }}>
                    <CalendarOutlined className="mr-2" />
                    Calendario
                </Title>
            </div>

            <Card className="shadow-sm">
                {/* Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <Button icon={<LeftOutlined />} onClick={navigatePrev} />
                        <Button onClick={goToToday}>Hoy</Button>
                        <Button icon={<RightOutlined />} onClick={navigateNext} />
                        <Text strong className="ml-4 text-lg capitalize">{getDateRangeLabel()}</Text>
                    </div>

                    <Radio.Group
                        value={viewMode}
                        onChange={e => setViewMode(e.target.value)}
                        optionType="button"
                        buttonStyle="solid"
                    >
                        <Radio.Button value="day">Día</Radio.Button>
                        <Radio.Button value="week">Semana</Radio.Button>
                        <Radio.Button value="month">Mes</Radio.Button>
                    </Radio.Group>
                </div>

                {/* Calendar Content */}
                <div className="min-h-[400px]">
                    {viewMode === 'day' && renderDayView()}
                    {viewMode === 'week' && renderWeekView()}
                    {viewMode === 'month' && renderMonthView()}
                </div>
            </Card>
        </div>
    );
};
