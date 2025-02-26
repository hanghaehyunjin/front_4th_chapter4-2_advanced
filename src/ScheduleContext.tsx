import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import { Schedule } from "./types.ts";
import dummyScheduleMap from "./dummyScheduleMap.ts";

interface ScheduleContextType {
  tableIds: string[];
  getSchedules: (tableId: string) => Schedule[];
  updateSchedule: (tableId: string, updatedSchedules: Schedule[]) => void;
  duplicateSchedule: (tableId: string) => void;
  removeSchedule: (tableId: string) => void;
  updateScheduleItem: (
    tableId: string,
    index: number,
    updatedSchedule: Schedule
  ) => void;
  removeScheduleItem: (tableId: string, day: string, time: number) => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(
  undefined
);

export const useScheduleContext = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error("useSchedule must be used within a ScheduleProvider");
  }
  return context;
};

interface TableContextType {
  schedules: Schedule[];
  tableId: string;
}

const TableContext = createContext<TableContextType>({
  schedules: [],
  tableId: "",
});

export const useTableContext = () => useContext(TableContext);

export const TableProvider = ({
  tableId,
  children,
}: PropsWithChildren<{ tableId: string }>) => {
  const { getSchedules } = useScheduleContext();
  const schedules = getSchedules(tableId);

  const value = useMemo(
    () => ({
      schedules,
      tableId,
    }),
    [schedules, tableId]
  );

  return (
    <TableContext.Provider value={value}>{children}</TableContext.Provider>
  );
};

export const ScheduleProvider = ({ children }: PropsWithChildren) => {
  const [schedulesMap, setSchedulesMap] =
    useState<Record<string, Schedule[]>>(dummyScheduleMap);

  const tableIds = useMemo(() => Object.keys(schedulesMap), [schedulesMap]);

  const getSchedules = useCallback(
    (tableId: string) => {
      return schedulesMap[tableId] || [];
    },
    [schedulesMap]
  );

  const updateSchedule = useCallback(
    (tableId: string, updatedSchedules: Schedule[]) => {
      setSchedulesMap((prev) => ({
        ...prev,
        [tableId]: updatedSchedules,
      }));
    },
    []
  );

  const duplicateSchedule = useCallback((targetId: string) => {
    setSchedulesMap((prev) => ({
      ...prev,
      [`schedule-${Date.now()}`]: [...prev[targetId]],
    }));
  }, []);

  const removeSchedule = useCallback((targetId: string) => {
    setSchedulesMap((prev) => {
      const newMap = { ...prev };
      delete newMap[targetId];
      return newMap;
    });
  }, []);

  const updateScheduleItem = useCallback(
    (tableId: string, index: number, updatedSchedule: Schedule) => {
      setSchedulesMap((prev) => ({
        ...prev,
        [tableId]: prev[tableId].map((schedule, idx) =>
          idx === index ? updatedSchedule : schedule
        ),
      }));
    },
    []
  );

  const removeScheduleItem = useCallback(
    (tableId: string, day: string, time: number) => {
      setSchedulesMap((prev) => ({
        ...prev,
        [tableId]: prev[tableId].filter(
          (schedule) => schedule.day !== day || !schedule.range.includes(time)
        ),
      }));
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      tableIds,
      getSchedules,
      updateSchedule,
      duplicateSchedule,
      removeSchedule,
      updateScheduleItem,
      removeScheduleItem,
    }),
    [
      tableIds,
      getSchedules,
      updateSchedule,
      duplicateSchedule,
      removeSchedule,
      updateScheduleItem,
      removeScheduleItem,
    ]
  );

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
};
