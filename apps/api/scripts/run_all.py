#!/usr/bin/env python3
import asyncio
import signal
import sys
from pathlib import Path

API_DIR = Path(__file__).resolve().parents[1]


async def main() -> None:
    commands = [
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4000"],
        [
            sys.executable,
            "-m",
            "uvicorn",
            "app.realtime.server:app",
            "--host",
            "0.0.0.0",
            "--port",
            "4001",
            "--no-access-log",
        ],
    ]
    processes = [
        await asyncio.create_subprocess_exec(*command, cwd=API_DIR)
        for command in commands
    ]
    stopping = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stopping.set)

    waiters = [asyncio.create_task(process.wait()) for process in processes]
    stop_waiter = asyncio.create_task(stopping.wait())
    done, _ = await asyncio.wait([*waiters, stop_waiter], return_when=asyncio.FIRST_COMPLETED)
    if stop_waiter not in done:
        for task in waiters:
            if task in done and task.result() != 0:
                stopping.set()
    for process in processes:
        if process.returncode is None:
            process.terminate()
    try:
        await asyncio.wait_for(asyncio.gather(*(process.wait() for process in processes)), timeout=10)
    except TimeoutError:
        for process in processes:
            if process.returncode is None:
                process.kill()
        await asyncio.gather(*(process.wait() for process in processes))
    stop_waiter.cancel()
    await asyncio.gather(stop_waiter, return_exceptions=True)


if __name__ == "__main__":
    asyncio.run(main())
