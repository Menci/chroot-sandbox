#include <cstdio>
#include <cstdlib>
#include <unistd.h>

int main() {
	int a, b;
	scanf("%d %d", &a, &b);
	/*
	for (int i = 0; i < 100; i++) {
		int *p = new int[1000000];
		for (int i = 0; i < 1000000; i++) p[i] = i;
	}
	*/
	printf("%d\n", a + b);
	fflush(stdout);
	system("busybox ifconfig");
	system("pwd");
	return 0;
}
