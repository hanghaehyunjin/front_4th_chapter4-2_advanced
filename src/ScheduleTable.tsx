import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@chakra-ui/react";
import { CellSize, DAY_LABELS, 분 } from "./constants.ts";
import { Schedule } from "./types.ts";
import { fill2, parseHnM } from "./utils.ts";
import { useDndContext, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Fragment, memo, useCallback, useMemo } from "react";
import { useScheduleContext, useTableContext } from "./ScheduleContext.tsx";

interface Props {
  onScheduleTimeClick?: (timeInfo: { day: string; time: number }) => void;
  onDeleteButtonClick?: (timeInfo: { day: string; time: number }) => void;
}

const TIMES = [
  ...Array(18)
    .fill(0)
    .map((v, k) => v + k * 30 * 분)
    .map((v) => `${parseHnM(v)}~${parseHnM(v + 30 * 분)}`),

  ...Array(6)
    .fill(18 * 30 * 분)
    .map((v, k) => v + k * 55 * 분)
    .map((v) => `${parseHnM(v)}~${parseHnM(v + 50 * 분)}`),
] as const;

const GridHeader = memo(() => (
  <GridItem key="교시" borderColor="gray.300" bg="gray.100">
    <Flex justifyContent="center" alignItems="center" h="full" w="full">
      <Text fontWeight="bold">교시</Text>
    </Flex>
  </GridItem>
));

const DayHeaders = memo(() => (
  <>
    {DAY_LABELS.map((day) => (
      <GridItem key={day} borderLeft="1px" borderColor="gray.300" bg="gray.100">
        <Flex justifyContent="center" alignItems="center" h="full">
          <Text fontWeight="bold">{day}</Text>
        </Flex>
      </GridItem>
    ))}
  </>
));

const TimeRow = memo(
  ({
    timeIndex,
    time,
    onCellClick,
  }: {
    timeIndex: number;
    time: string;
    onCellClick: (day: string, time: number) => void;
  }) => {
    return (
      <Fragment key={`시간-${timeIndex + 1}`}>
        <GridItem
          borderTop="1px solid"
          borderColor="gray.300"
          bg={timeIndex > 17 ? "gray.200" : "gray.100"}
        >
          <Flex justifyContent="center" alignItems="center" h="full">
            <Text fontSize="xs">
              {fill2(timeIndex + 1)} ({time})
            </Text>
          </Flex>
        </GridItem>

        {DAY_LABELS.map((day) => (
          <GridItem
            key={`${day}-${timeIndex + 2}`}
            borderWidth="1px 0 0 1px"
            borderColor="gray.300"
            bg={timeIndex > 17 ? "gray.100" : "white"}
            cursor="pointer"
            _hover={{ bg: "yellow.100" }}
            onClick={() => onCellClick(day, timeIndex + 1)}
          />
        ))}
      </Fragment>
    );
  }
);

const TableGrid = memo(
  ({ onCellClick }: { onCellClick: (day: string, time: number) => void }) => {
    return (
      <Grid
        templateColumns={`120px repeat(${DAY_LABELS.length}, ${CellSize.WIDTH}px)`}
        templateRows={`40px repeat(${TIMES.length}, ${CellSize.HEIGHT}px)`}
        bg="white"
        fontSize="sm"
        textAlign="center"
        outline="1px solid"
        outlineColor="gray.300"
      >
        <GridHeader />
        <DayHeaders />

        {TIMES.map((time, timeIndex) => (
          <TimeRow
            key={`time-row-${timeIndex}`}
            timeIndex={timeIndex}
            time={time}
            onCellClick={onCellClick}
          />
        ))}
      </Grid>
    );
  }
);

const ScheduleItems = memo(() => {
  const { schedules, tableId } = useTableContext();
  const dndContext = useDndContext();

  const getColor = useCallback(
    (lectureId: string): string => {
      const lectures = [...new Set(schedules.map(({ lecture }) => lecture.id))];
      const colors = ["#fdd", "#ffd", "#dff", "#ddf", "#fdf", "#dfd"];
      return colors[lectures.indexOf(lectureId) % colors.length];
    },
    [schedules]
  );

  const activeId = dndContext.active?.id;

  return (
    <>
      {schedules.map((schedule, index) => (
        <DraggableSchedule
          key={`${schedule.lecture.id}-${index}`}
          id={`${tableId}:${index}`}
          data={schedule}
          bg={getColor(schedule.lecture.id)}
          isDragging={activeId === `${tableId}:${index}`}
        />
      ))}
    </>
  );
});

const DraggableSchedule = memo(
  ({
    id,
    data,
    bg,
    isDragging,
  }: {
    id: string;
    data: Schedule;
    bg: string;
    isDragging: boolean;
  }) => {
    const { tableId } = useTableContext();
    const { removeScheduleItem } = useScheduleContext();
    const { day, range, room, lecture } = data;
    const { attributes, setNodeRef, listeners, transform } = useDraggable({
      id,
    });
    const leftIndex = DAY_LABELS.indexOf(day as (typeof DAY_LABELS)[number]);
    const topIndex = range[0] - 1;
    const size = range.length;

    const handleDelete = useCallback(() => {
      removeScheduleItem(tableId, day, range[0]);
    }, [removeScheduleItem, tableId, day, range]);

    return (
      <Popover>
        <PopoverTrigger>
          <Box
            position="absolute"
            left={`${120 + CellSize.WIDTH * leftIndex + 1}px`}
            top={`${40 + (topIndex * CellSize.HEIGHT + 1)}px`}
            width={CellSize.WIDTH - 1 + "px"}
            height={CellSize.HEIGHT * size - 1 + "px"}
            bg={bg}
            p={1}
            boxSizing="border-box"
            cursor="pointer"
            ref={setNodeRef}
            transform={CSS.Translate.toString(transform)}
            zIndex={isDragging ? 100 : 10}
            {...listeners}
            {...attributes}
          >
            <Text fontSize="sm" fontWeight="bold">
              {lecture.title}
            </Text>
            <Text fontSize="xs">{room}</Text>
          </Box>
        </PopoverTrigger>
        <PopoverContent
          onClick={(event) => event.stopPropagation()}
          rootProps={{ style: { zIndex: 20 } }}
        >
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverBody>
            <Text>강의를 삭제하시겠습니까?</Text>
            <Button colorScheme="red" size="xs" onClick={handleDelete}>
              삭제
            </Button>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  }
);

const ScheduleTable = memo(({ onScheduleTimeClick }: Props) => {
  const { tableId } = useTableContext();
  const dndContext = useDndContext();

  const handleCellClick = useCallback(
    (day: string, time: number) => {
      onScheduleTimeClick?.({ day, time });
    },
    [onScheduleTimeClick]
  );

  const activeTableId = useMemo(() => {
    const activeId = dndContext.active?.id;
    if (activeId) {
      return String(activeId).split(":")[0];
    }
    return null;
  }, [dndContext.active]);

  return (
    <Box
      position="relative"
      outline={activeTableId === tableId ? "5px dashed" : undefined}
      outlineColor="blue.300"
    >
      <TableGrid onCellClick={handleCellClick} />
      <ScheduleItems />
    </Box>
  );
});

export default ScheduleTable;
